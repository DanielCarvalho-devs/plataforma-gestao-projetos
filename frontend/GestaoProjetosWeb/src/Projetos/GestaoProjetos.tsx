import {
    ChevronDown,
    ChevronRight,
    ClipboardList,
    FolderKanban,
    Pencil,
    Plus,
    Power,
    RefreshCcw,
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

import type {
    SyntheticEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import AppSidebar from "../components/AppSidebar";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

import "./GestaoProjetos.css";

interface Cliente {
    idCliente: number;
    nome: string;
    empresa?: string | null;
    telefone?: string | null;
    email?: string | null;
    morada?: string | null;
    observacoes?: string | null;
    ativo: boolean;
    dataCriacao?: string;
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

type ModalTipo =
    | "cliente"
    | "projeto"
    | "tarefa"
    | null;

type ModoFormulario =
    | "novo"
    | "editar";

type FiltroRegistos =
    | "ativos"
    | "inativos"
    | "todos";

interface ClienteForm {
    nome: string;
    empresa: string;
    telefone: string;
    email: string;
    morada: string;
    observacoes: string;
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
    idProjeto: string;
    idUtilizador: string;
    titulo: string;
    descricao: string;
    data: string;
    horas: string;
    estado: string;
    prioridade: string;
}

const clienteInicial: ClienteForm = {
    nome: "",
    empresa: "",
    telefone: "",
    email: "",
    morada: "",
    observacoes: "",
};

const projetoInicial: ProjetoForm = {
    idCliente: "",
    idResponsavel: "",
    codigo: "",
    nome: "",
    descricao: "",
    localObra: "",
    dataInicio: "",
    prazoPrevisto: "",
    estado: "Planeado",
    observacoes: "",
};

const obterDataHoje = () => {
    const hoje = new Date();

    const ano =
        hoje.getFullYear();

    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dia =
        String(
            hoje.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${ano}-${mes}-${dia}`;
};

const tarefaInicial: TarefaForm = {
    idProjeto: "",
    idUtilizador: "",
    titulo: "",
    descricao: "",
    data: obterDataHoje(),
    horas: "",
    estado: "Pendente",
    prioridade: "Normal",
};

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

export default function GestaoProjetos() {
    const navigate =
        useNavigate();

    const {
        utilizador,
    } =
        useAuth();

    const [
        clientes,
        setClientes,
    ] =
        useState<Cliente[]>([]);

    const [
        todosProjetos,
        setTodosProjetos,
    ] =
        useState<Projeto[]>([]);

    const [
        tarefas,
        setTarefas,
    ] =
        useState<Tarefa[]>([]);

    const [
        utilizadores,
        setUtilizadores,
    ] =
        useState<Utilizador[]>([]);

    const [
        pesquisa,
        setPesquisa,
    ] =
        useState("");

    const [
        filtroRegistos,
        setFiltroRegistos,
    ] =
        useState<FiltroRegistos>(
            "ativos"
        );

    const [
        carregando,
        setCarregando,
    ] =
        useState(true);

    const [
        processando,
        setProcessando,
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

    const [
        modal,
        setModal,
    ] =
        useState<ModalTipo>(null);

    const [
        modoFormulario,
        setModoFormulario,
    ] =
        useState<ModoFormulario>(
            "novo"
        );

    const [
        clienteSelecionado,
        setClienteSelecionado,
    ] =
        useState<Cliente | null>(
            null
        );

    const [
        projetoSelecionado,
        setProjetoSelecionado,
    ] =
        useState<Projeto | null>(
            null
        );

    const [
        clientesAbertos,
        setClientesAbertos,
    ] =
        useState<number[]>([]);

    const [
        projetosAbertos,
        setProjetosAbertos,
    ] =
        useState<number[]>([]);

    const [
        clienteForm,
        setClienteForm,
    ] =
        useState<ClienteForm>(
            clienteInicial
        );

    const [
        projetoForm,
        setProjetoForm,
    ] =
        useState<ProjetoForm>(
            projetoInicial
        );

    const [
        tarefaForm,
        setTarefaForm,
    ] =
        useState<TarefaForm>(
            tarefaInicial
        );

    const eAdministrador =
        utilizador?.perfil ===
        "Administrador";

    const podeGerirProjetos =
        utilizador?.perfil ===
        "Administrador" ||
        utilizador?.perfil ===
        "Gestor";

    const clientesAtivos =
        useMemo(
            () =>
                clientes.filter(
                    (
                        cliente
                    ) =>
                        cliente.ativo
                ),
            [clientes]
        );

    const clientesInativos =
        useMemo(
            () =>
                clientes.filter(
                    (
                        cliente
                    ) =>
                        !cliente.ativo
                ),
            [clientes]
        );

    const projetosAtivos =
        useMemo(
            () =>
                todosProjetos.filter(
                    (
                        projeto
                    ) =>
                        projeto.ativo
                ),
            [
                todosProjetos,
            ]
        );

    const projetosInativos =
        useMemo(
            () =>
                todosProjetos.filter(
                    (
                        projeto
                    ) =>
                        !projeto.ativo
                ),
            [
                todosProjetos,
            ]
        );

    useEffect(() => {
        void carregarDados();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        eAdministrador,
    ]);

    const carregarDados =
        async () => {
            setCarregando(
                true
            );

            setErro("");

            try {
                const [
                    clientesResponse,
                    todosProjetosResponse,
                    tarefasResponse,
                ] =
                    await Promise.all(
                        [
                            apiRequest<
                                Cliente[]
                            >(
                                "/Clientes"
                            ),

                            apiRequest<
                                Projeto[]
                            >(
                                "/Projetos/todos"
                            ),

                            apiRequest<
                                Tarefa[]
                            >(
                                "/Tarefas"
                            ),
                        ]
                    );

                setClientes(
                    Array.isArray(
                        clientesResponse
                    )
                        ? clientesResponse
                        : []
                );

                setTodosProjetos(
                    Array.isArray(
                        todosProjetosResponse
                    )
                        ? todosProjetosResponse
                        : []
                );

                setTarefas(
                    Array.isArray(
                        tarefasResponse
                    )
                        ? tarefasResponse
                        : []
                );

                if (
                    eAdministrador
                ) {
                    try {
                        const respostaUtilizadores =
                            await apiRequest<
                                Utilizador[]
                            >(
                                "/Utilizadores"
                            );

                        setUtilizadores(
                            respostaUtilizadores.filter(
                                (
                                    item
                                ) =>
                                    item.ativo
                            )
                        );
                    } catch {
                        setUtilizadores(
                            []
                        );
                    }
                } else {
                    setUtilizadores(
                        []
                    );
                }
            } catch (
            error
            ) {
                console.error(
                    error
                );

                setErro(
                    error instanceof
                        Error
                        ? error.message
                        : "Não foi possível carregar os dados da gestão de projetos."
                );
            } finally {
                setCarregando(
                    false
                );
            }
        };

    const normalizarTexto =
        (
            valor?:
                | string
                | null
        ) => {
            return (
                valor ?? ""
            )
                .toLocaleLowerCase(
                    "pt-PT"
                )
                .normalize(
                    "NFD"
                )
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                );
        };

    const gerarProximoCodigoProjeto =
        () => {
            let maiorNumero =
                0;

            todosProjetos.forEach(
                (
                    projeto
                ) => {
                    const codigo =
                        projeto.codigo
                            ?.trim()
                            .toUpperCase();

                    const correspondencia =
                        /^PRJ-(\d+)$/.exec(
                            codigo ??
                            ""
                        );

                    if (
                        !correspondencia
                    ) {
                        return;
                    }

                    const numero =
                        Number(
                            correspondencia[
                            1
                            ]
                        );

                    if (
                        Number.isInteger(
                            numero
                        ) &&
                        numero >
                        maiorNumero
                    ) {
                        maiorNumero =
                            numero;
                    }
                }
            );

            const proximoNumero =
                maiorNumero +
                1;

            return `PRJ-${String(
                proximoNumero
            ).padStart(
                4,
                "0"
            )}`;
        };

    const pesquisaNormalizada =
        normalizarTexto(
            pesquisa.trim()
        );

    const dadosFiltrados =
        useMemo(() => {
            return clientes
                .map(
                    (
                        cliente
                    ) => {
                        const todosProjetosCliente =
                            todosProjetos.filter(
                                (
                                    projeto
                                ) =>
                                    projeto.idCliente ===
                                    cliente.idCliente
                            );

                        let projetosCliente =
                            todosProjetosCliente;

                        if (
                            filtroRegistos ===
                            "ativos"
                        ) {
                            if (
                                !cliente.ativo
                            ) {
                                return null;
                            }

                            projetosCliente =
                                todosProjetosCliente.filter(
                                    (
                                        projeto
                                    ) =>
                                        projeto.ativo
                                );
                        }

                        if (
                            filtroRegistos ===
                            "inativos"
                        ) {
                            const projetosInativosCliente =
                                todosProjetosCliente.filter(
                                    (
                                        projeto
                                    ) =>
                                        !projeto.ativo
                                );

                            const clienteTemRegistoInativo =
                                !cliente.ativo ||
                                projetosInativosCliente.length >
                                0;

                            if (
                                !clienteTemRegistoInativo
                            ) {
                                return null;
                            }

                            projetosCliente =
                                cliente.ativo
                                    ? projetosInativosCliente
                                    : todosProjetosCliente;
                        }

                        if (
                            !pesquisaNormalizada
                        ) {
                            return {
                                cliente,
                                projetos:
                                    projetosCliente,
                            };
                        }

                        const clienteCorresponde =
                            normalizarTexto(
                                cliente.nome
                            ).includes(
                                pesquisaNormalizada
                            ) ||
                            normalizarTexto(
                                cliente.empresa
                            ).includes(
                                pesquisaNormalizada
                            ) ||
                            normalizarTexto(
                                cliente.email
                            ).includes(
                                pesquisaNormalizada
                            ) ||
                            normalizarTexto(
                                cliente.telefone
                            ).includes(
                                pesquisaNormalizada
                            );

                        const projetosCorrespondentes =
                            projetosCliente.filter(
                                (
                                    projeto
                                ) => {
                                    const projetoCorresponde =
                                        normalizarTexto(
                                            projeto.codigo
                                        ).includes(
                                            pesquisaNormalizada
                                        ) ||
                                        normalizarTexto(
                                            projeto.nome
                                        ).includes(
                                            pesquisaNormalizada
                                        ) ||
                                        normalizarTexto(
                                            projeto.estado
                                        ).includes(
                                            pesquisaNormalizada
                                        ) ||
                                        normalizarTexto(
                                            projeto.localObra
                                        ).includes(
                                            pesquisaNormalizada
                                        );

                                    const tarefaCorresponde =
                                        tarefas.some(
                                            (
                                                tarefa
                                            ) =>
                                                tarefa.idProjeto ===
                                                projeto.idProjeto &&
                                                (
                                                    normalizarTexto(
                                                        tarefa.titulo
                                                    ).includes(
                                                        pesquisaNormalizada
                                                    ) ||
                                                    normalizarTexto(
                                                        tarefa.estado
                                                    ).includes(
                                                        pesquisaNormalizada
                                                    ) ||
                                                    normalizarTexto(
                                                        tarefa.prioridade
                                                    ).includes(
                                                        pesquisaNormalizada
                                                    )
                                                )
                                        );

                                    return (
                                        projetoCorresponde ||
                                        tarefaCorresponde
                                    );
                                }
                            );

                        if (
                            !clienteCorresponde &&
                            projetosCorrespondentes.length ===
                            0
                        ) {
                            return null;
                        }

                        return {
                            cliente,
                            projetos:
                                clienteCorresponde
                                    ? projetosCliente
                                    : projetosCorrespondentes,
                        };
                    }
                )
                .filter(
                    (
                        item
                    ): item is {
                        cliente: Cliente;
                        projetos: Projeto[];
                    } =>
                        item !==
                        null
                );
        }, [
            clientes,
            todosProjetos,
            tarefas,
            pesquisaNormalizada,
            filtroRegistos,
        ]);

    const alternarCliente =
        (
            idCliente: number
        ) => {
            setClientesAbertos(
                (
                    estadoAtual
                ) =>
                    estadoAtual.includes(
                        idCliente
                    )
                        ? estadoAtual.filter(
                            (
                                id
                            ) =>
                                id !==
                                idCliente
                        )
                        : [
                            ...estadoAtual,
                            idCliente,
                        ]
            );
        };

    const alternarProjeto =
        (
            idProjeto: number
        ) => {
            setProjetosAbertos(
                (
                    estadoAtual
                ) =>
                    estadoAtual.includes(
                        idProjeto
                    )
                        ? estadoAtual.filter(
                            (
                                id
                            ) =>
                                id !==
                                idProjeto
                        )
                        : [
                            ...estadoAtual,
                            idProjeto,
                        ]
            );
        };

    const obterTarefasProjeto =
        (
            idProjeto: number
        ) => {
            return tarefas.filter(
                (
                    tarefa
                ) =>
                    tarefa.idProjeto ===
                    idProjeto
            );
        };

    const limparMensagens =
        () => {
            setErro("");
            setSucesso("");
        };

    const mudarFiltro =
        (
            novoFiltro:
                FiltroRegistos
        ) => {
            setFiltroRegistos(
                novoFiltro
            );

            setClientesAbertos(
                []
            );

            setProjetosAbertos(
                []
            );

            setErro("");
            setSucesso("");
        };

    const abrirNovoCliente =
        () => {
            limparMensagens();

            setModoFormulario(
                "novo"
            );

            setClienteSelecionado(
                null
            );

            setClienteForm(
                clienteInicial
            );

            setModal(
                "cliente"
            );
        };

    const abrirEditarCliente =
        (
            cliente: Cliente
        ) => {
            if (
                !podeGerirProjetos ||
                !cliente.ativo
            ) {
                return;
            }

            limparMensagens();

            setModoFormulario(
                "editar"
            );

            setClienteSelecionado(
                cliente
            );

            setClienteForm({
                nome:
                    cliente.nome ??
                    "",

                empresa:
                    cliente.empresa ??
                    "",

                telefone:
                    cliente.telefone ??
                    "",

                email:
                    cliente.email ??
                    "",

                morada:
                    cliente.morada ??
                    "",

                observacoes:
                    cliente.observacoes ??
                    "",
            });

            setModal(
                "cliente"
            );
        };

    const abrirNovoProjeto =
        () => {
            limparMensagens();

            const codigoAutomatico =
                gerarProximoCodigoProjeto();

            setModoFormulario(
                "novo"
            );

            setProjetoSelecionado(
                null
            );

            setProjetoForm({
                ...projetoInicial,

                codigo:
                    codigoAutomatico,

                idCliente:
                    clientesAtivos.length ===
                        1
                        ? String(
                            clientesAtivos[
                                0
                            ]
                                .idCliente
                        )
                        : "",
            });

            setModal(
                "projeto"
            );
        };

    const abrirEditarProjeto =
        (
            projeto: Projeto
        ) => {
            if (
                !podeGerirProjetos ||
                !projeto.ativo
            ) {
                return;
            }

            limparMensagens();

            setModoFormulario(
                "editar"
            );

            setProjetoSelecionado(
                projeto
            );

            setProjetoForm({
                idCliente:
                    String(
                        projeto.idCliente
                    ),

                idResponsavel:
                    projeto.idResponsavel
                        ? String(
                            projeto.idResponsavel
                        )
                        : "",

                codigo:
                    projeto.codigo ??
                    "",

                nome:
                    projeto.nome ??
                    "",

                descricao:
                    projeto.descricao ??
                    "",

                localObra:
                    projeto.localObra ??
                    "",

                dataInicio:
                    projeto.dataInicio?.slice(
                        0,
                        10
                    ) ??
                    "",

                prazoPrevisto:
                    projeto.prazoPrevisto?.slice(
                        0,
                        10
                    ) ??
                    "",

                estado:
                    projeto.estado ??
                    "Planeado",

                observacoes:
                    projeto.observacoes ??
                    "",
            });

            setModal(
                "projeto"
            );
        };

    const abrirNovaTarefa =
        () => {
            limparMensagens();

            setModoFormulario(
                "novo"
            );

            setTarefaForm({
                ...tarefaInicial,

                data:
                    obterDataHoje(),

                idProjeto:
                    projetosAtivos.length ===
                        1
                        ? String(
                            projetosAtivos[
                                0
                            ]
                                .idProjeto
                        )
                        : "",
            });

            setModal(
                "tarefa"
            );
        };

    const fecharModal =
        () => {
            if (
                processando
            ) {
                return;
            }

            setErro("");

            setModal(
                null
            );

            setClienteSelecionado(
                null
            );

            setProjetoSelecionado(
                null
            );
        };

    const guardarCliente =
        async (
            evento:
                SyntheticEvent<HTMLFormElement>
        ) => {
            evento.preventDefault();

            if (
                !clienteForm.nome.trim()
            ) {
                setErro(
                    "O nome do cliente é obrigatório."
                );

                return;
            }

            setProcessando(
                true
            );

            setErro("");

            try {
                const dadosCliente =
                {
                    nome:
                        clienteForm.nome.trim(),

                    empresa:
                        clienteForm.empresa.trim() ||
                        null,

                    telefone:
                        clienteForm.telefone.trim() ||
                        null,

                    email:
                        clienteForm.email.trim() ||
                        null,

                    morada:
                        clienteForm.morada.trim() ||
                        null,

                    observacoes:
                        clienteForm.observacoes.trim() ||
                        null,
                };

                if (
                    modoFormulario ===
                    "editar" &&
                    clienteSelecionado
                ) {
                    await apiRequest(
                        `/Clientes/${clienteSelecionado.idCliente}`,
                        {
                            method:
                                "PUT",

                            body:
                                JSON.stringify(
                                    {
                                        idCliente:
                                            clienteSelecionado.idCliente,

                                        ...dadosCliente,

                                        ativo:
                                            clienteSelecionado.ativo,

                                        dataCriacao:
                                            clienteSelecionado.dataCriacao,
                                    }
                                ),
                        }
                    );

                    setSucesso(
                        `Cliente "${clienteForm.nome.trim()}" atualizado com sucesso.`
                    );
                } else {
                    await apiRequest(
                        "/Clientes",
                        {
                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    dadosCliente
                                ),
                        }
                    );

                    setSucesso(
                        "Cliente criado com sucesso."
                    );
                }

                setFiltroRegistos(
                    "ativos"
                );

                setModal(
                    null
                );

                setClienteSelecionado(
                    null
                );

                await carregarDados();
            } catch (
            error
            ) {
                setErro(
                    error instanceof
                        Error
                        ? error.message
                        : "Não foi possível guardar o cliente."
                );
            } finally {
                setProcessando(
                    false
                );
            }
        };

    const guardarProjeto =
        async (
            evento:
                SyntheticEvent<HTMLFormElement>
        ) => {
            evento.preventDefault();

            if (
                !projetoForm.idCliente
            ) {
                setErro(
                    "Selecione o cliente."
                );

                return;
            }

            if (
                !projetoForm.codigo.trim()
            ) {
                setErro(
                    "Não foi possível determinar o código do projeto."
                );

                return;
            }

            if (
                !projetoForm.nome.trim()
            ) {
                setErro(
                    "O nome do projeto é obrigatório."
                );

                return;
            }

            if (
                projetoForm.dataInicio &&
                projetoForm.prazoPrevisto &&
                projetoForm.prazoPrevisto <
                projetoForm.dataInicio
            ) {
                setErro(
                    "O prazo previsto não pode ser anterior à data de início."
                );

                return;
            }

            setProcessando(
                true
            );

            setErro("");

            try {
                const payload =
                {
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
                };

                if (
                    modoFormulario ===
                    "editar" &&
                    projetoSelecionado
                ) {
                    await apiRequest(
                        `/Projetos/${projetoSelecionado.idProjeto}`,
                        {
                            method:
                                "PUT",

                            body:
                                JSON.stringify(
                                    payload
                                ),
                        }
                    );

                    setSucesso(
                        `Projeto ${projetoForm.codigo} atualizado com sucesso.`
                    );
                } else {
                    await apiRequest(
                        "/Projetos",
                        {
                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    payload
                                ),
                        }
                    );

                    setSucesso(
                        `Projeto ${projetoForm.codigo} criado com sucesso.`
                    );
                }

                setFiltroRegistos(
                    "ativos"
                );

                setModal(
                    null
                );

                setProjetoSelecionado(
                    null
                );

                await carregarDados();
            } catch (
            error
            ) {
                setErro(
                    error instanceof
                        Error
                        ? error.message
                        : "Não foi possível guardar o projeto."
                );
            } finally {
                setProcessando(
                    false
                );
            }
        };

    const guardarTarefa =
        async (
            evento:
                SyntheticEvent<HTMLFormElement>
        ) => {
            evento.preventDefault();

            if (
                !tarefaForm.idProjeto
            ) {
                setErro(
                    "Selecione o projeto."
                );

                return;
            }

            if (
                !tarefaForm.titulo.trim()
            ) {
                setErro(
                    "O título da tarefa é obrigatório."
                );

                return;
            }

            if (
                !tarefaForm.data
            ) {
                setErro(
                    "A data da tarefa é obrigatória."
                );

                return;
            }

            setProcessando(
                true
            );

            setErro("");

            try {
                await apiRequest(
                    "/Tarefas",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                {
                                    idProjeto:
                                        Number(
                                            tarefaForm.idProjeto
                                        ),

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
                                }
                            ),
                    }
                );

                setFiltroRegistos(
                    "ativos"
                );

                setModal(
                    null
                );

                setSucesso(
                    "Tarefa criada com sucesso."
                );

                await carregarDados();
            } catch (
            error
            ) {
                setErro(
                    error instanceof
                        Error
                        ? error.message
                        : "Não foi possível criar a tarefa."
                );
            } finally {
                setProcessando(
                    false
                );
            }
        };

    const desativarCliente =
        async (
            cliente: Cliente
        ) => {
            if (
                !podeGerirProjetos
            ) {
                return;
            }

            const confirmado =
                window.confirm(
                    `Tem a certeza de que pretende desativar o cliente "${cliente.nome}"?`
                );

            if (
                !confirmado
            ) {
                return;
            }

            limparMensagens();

            try {
                await apiRequest(
                    `/Clientes/${cliente.idCliente}`,
                    {
                        method:
                            "DELETE",
                    }
                );

                setSucesso(
                    `Cliente "${cliente.nome}" desativado com sucesso.`
                );

                await carregarDados();
            } catch (
            error
            ) {
                setErro(
                    error instanceof
                        Error
                        ? error.message
                        : "Não foi possível desativar o cliente."
                );
            }
        };

    const reativarCliente =
        async (
            cliente: Cliente
        ) => {
            if (
                !podeGerirProjetos
            ) {
                return;
            }

            const confirmado =
                window.confirm(
                    `Pretende reativar o cliente "${cliente.nome}"?`
                );

            if (
                !confirmado
            ) {
                return;
            }

            limparMensagens();

            try {
                await apiRequest(
                    `/Clientes/${cliente.idCliente}/reativar`,
                    {
                        method:
                            "PUT",
                    }
                );

                setSucesso(
                    `Cliente "${cliente.nome}" reativado com sucesso.`
                );

                await carregarDados();
            } catch (
            error
            ) {
                setErro(
                    error instanceof
                        Error
                        ? error.message
                        : "Não foi possível reativar o cliente."
                );
            }
        };

    const excluirClientePermanente =
        async (
            cliente: Cliente
        ) => {
            if (
                !eAdministrador
            ) {
                return;
            }

            if (
                cliente.ativo
            ) {
                setErro(
                    "Desative o cliente antes de o excluir permanentemente."
                );

                return;
            }

            const primeiraConfirmacao =
                window.confirm(
                    `ATENÇÃO!\n\nPretende excluir permanentemente o cliente "${cliente.nome}"?\n\nEsta operação não pode ser desfeita.`
                );

            if (
                !primeiraConfirmacao
            ) {
                return;
            }

            const segundaConfirmacao =
                window.confirm(
                    `Última confirmação:\n\nO cliente "${cliente.nome}" será removido definitivamente da base de dados.\n\nDeseja continuar?`
                );

            if (
                !segundaConfirmacao
            ) {
                return;
            }

            limparMensagens();

            try {
                await apiRequest(
                    `/Clientes/${cliente.idCliente}/permanente`,
                    {
                        method:
                            "DELETE",
                    }
                );

                setSucesso(
                    `Cliente "${cliente.nome}" excluído permanentemente.`
                );

                await carregarDados();
            } catch (
            error
            ) {
                setErro(
                    error instanceof
                        Error
                        ? error.message
                        : "Não foi possível excluir permanentemente o cliente."
                );
            }
        };

    const desativarProjeto =
        async (
            projeto: Projeto
        ) => {
            if (
                !podeGerirProjetos
            ) {
                return;
            }

            const confirmado =
                window.confirm(
                    `Tem a certeza de que pretende desativar o projeto "${projeto.codigo} - ${projeto.nome}"?`
                );

            if (
                !confirmado
            ) {
                return;
            }

            limparMensagens();

            try {
                await apiRequest(
                    `/Projetos/${projeto.idProjeto}`,
                    {
                        method:
                            "DELETE",
                    }
                );

                setSucesso(
                    `Projeto ${projeto.codigo} desativado com sucesso.`
                );

                await carregarDados();
            } catch (
            error
            ) {
                setErro(
                    error instanceof
                        Error
                        ? error.message
                        : "Não foi possível desativar o projeto."
                );
            }
        };

    const reativarProjeto =
        async (
            projeto: Projeto
        ) => {
            if (
                !podeGerirProjetos
            ) {
                return;
            }

            const clienteDoProjeto =
                clientes.find(
                    (
                        cliente
                    ) =>
                        cliente.idCliente ===
                        projeto.idCliente
                );

            if (
                clienteDoProjeto &&
                !clienteDoProjeto.ativo
            ) {
                setErro(
                    "Reative primeiro o cliente deste projeto."
                );

                return;
            }

            const confirmado =
                window.confirm(
                    `Pretende reativar o projeto "${projeto.codigo} - ${projeto.nome}"?`
                );

            if (
                !confirmado
            ) {
                return;
            }

            limparMensagens();

            try {
                await apiRequest(
                    `/Projetos/${projeto.idProjeto}/reativar`,
                    {
                        method:
                            "PUT",
                    }
                );

                setSucesso(
                    `Projeto ${projeto.codigo} reativado com sucesso.`
                );

                await carregarDados();
            } catch (
            error
            ) {
                setErro(
                    error instanceof
                        Error
                        ? error.message
                        : "Não foi possível reativar o projeto."
                );
            }
        };

    const excluirProjetoPermanente =
        async (
            projeto: Projeto
        ) => {
            if (
                !eAdministrador
            ) {
                return;
            }

            if (
                projeto.ativo
            ) {
                setErro(
                    "Desative o projeto antes de o excluir permanentemente."
                );

                return;
            }

            const primeiraConfirmacao =
                window.confirm(
                    `ATENÇÃO!\n\nPretende excluir permanentemente o projeto "${projeto.codigo} - ${projeto.nome}"?\n\nEsta operação não pode ser desfeita.`
                );

            if (
                !primeiraConfirmacao
            ) {
                return;
            }

            const segundaConfirmacao =
                window.confirm(
                    `Última confirmação:\n\nO projeto "${projeto.codigo}" será removido definitivamente da base de dados.\n\nDeseja continuar?`
                );

            if (
                !segundaConfirmacao
            ) {
                return;
            }

            limparMensagens();

            try {
                await apiRequest(
                    `/Projetos/${projeto.idProjeto}/permanente`,
                    {
                        method:
                            "DELETE",
                    }
                );

                setSucesso(
                    `Projeto ${projeto.codigo} excluído permanentemente.`
                );

                await carregarDados();
            } catch (
            error
            ) {
                setErro(
                    error instanceof
                        Error
                        ? error.message
                        : "Não foi possível excluir permanentemente o projeto."
                );
            }
        };

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
                return "status-success";
            }

            if (
                valor.includes(
                    "desenvolvimento"
                )
            ) {
                return "status-progress";
            }

            if (
                valor.includes(
                    "suspenso"
                ) ||
                valor.includes(
                    "cancelado"
                )
            ) {
                return "status-danger";
            }

            return "status-neutral";
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
                valor.includes(
                    "concluida"
                )
            ) {
                return "task-status-success";
            }

            if (
                valor.includes(
                    "execucao"
                )
            ) {
                return "task-status-progress";
            }

            if (
                valor.includes(
                    "cancelada"
                )
            ) {
                return "task-status-danger";
            }

            return "task-status-neutral";
        };

    return (
        <div className= "gestao-projetos-shell" >
        <AppSidebar />

        < main className = "gestao-projetos-main" >
            <header className="gestao-projetos-topbar" >
                <div>
                <span className="gestao-breadcrumb" >
                    Plataforma /
                    Projetos
                    </span>

                    <h1>
                            Gestão de
    Projetos
        </h1>

        <p>
                            Consulte e
    organize
    clientes,
        projetos e
                            tarefas numa
                            única área.
                        </p>
        </div>
        </header>

        < div className = "gestao-projetos-content" >
            <section className="gestao-resumo" >
                <article className="gestao-resumo-card" >
                    <div className="gestao-resumo-icon" >
                        <UserRound
                                    size={
        22
    }
                                />
        </div>

        < div >
        <span>
        Clientes
    ativos
        </span>

        <strong>
    {
        clientesAtivos.length
    }
    </strong>
        </div>
        </article>

        < article className = "gestao-resumo-card" >
            <div className="gestao-resumo-icon" >
                <FolderKanban
                                    size={
        22
    }
                                />
        </div>

        < div >
        <span>
        Projetos
    ativos
        </span>

        <strong>
    {
        projetosAtivos.length
    }
    </strong>
        </div>
        </article>

        < article className = "gestao-resumo-card" >
            <div className="gestao-resumo-icon" >
                <ClipboardList
                                    size={
        22
    }
                                />
        </div>

        < div >
        <span>
        Tarefas
        </span>

        <strong>
    {
        tarefas.length
    }
    </strong>
        </div>
        </article>
        </section>

        < section className = "gestao-toolbar" >
            <div className="gestao-pesquisa" >
                <Search
                                size={
        20
    }
                            />

        < input
    type = "text"
    value = {
        pesquisa
    }
    onChange = {(
        evento
    ) =>
    setPesquisa(
        evento
            .target
            .value
    )
}
placeholder = "Pesquisar cliente, projeto ou tarefa..."
    />
    </div>

    < div className = "gestao-acoes-principais" >
    { podeGerirProjetos && (
            <button
                                    type="button"
className = "gestao-btn gestao-btn-secundario"
onClick = {
    abrirNovoCliente
}
    >
    <Plus
                                        size={
    17
}
                                    />

Novo
cliente
    </button>
                            )}

{
    podeGerirProjetos && (
        <button
                                    type="button"
    className = "gestao-btn gestao-btn-secundario"
    onClick = {
        abrirNovoProjeto
    }
    disabled = {
        clientesAtivos.length ===
            0
    }
        >
        <Plus
                                        size={
        17
    }
                                    />

    Novo
    projeto
        </button>
                            )
}

<button
                                type="button"
className = "gestao-btn gestao-btn-primario"
onClick = {
    abrirNovaTarefa
}
disabled = {
    projetosAtivos.length ===
        0
}
    >
    <Plus
                                    size={
    17
}
                                />

                                Nova tarefa
    </button>
    </div>
    </section>

    < section
style = {{
    display:
    "flex",
        alignItems:
    "center",
        justifyContent:
    "space-between",
        flexWrap:
    "wrap",
        gap:
    "14px",
        margin:
    "4px 0 22px",
                        }}
                    >
    <div
                            style={
    {
        display:
        "flex",
            alignItems:
        "center",
            gap:
        "8px",
            padding:
        "6px",
            border:
        "1px solid #e3e8ef",
            borderRadius:
        "12px",
            background:
        "#ffffff",
            boxShadow:
        "0 3px 12px rgba(15, 23, 42, 0.04)",
                            }
}
                        >
    <button
                                type="button"
className = {
    filtroRegistos ===
    "ativos"
    ? "gestao-btn gestao-btn-primario"
    : "gestao-btn gestao-btn-secundario"
                                }
onClick = {() =>
mudarFiltro(
    "ativos"
)
                                }
                            >
    Ativos
    </button>

    < button
type = "button"
className = {
    filtroRegistos ===
    "inativos"
    ? "gestao-btn gestao-btn-primario"
    : "gestao-btn gestao-btn-secundario"
                                }
onClick = {() =>
mudarFiltro(
    "inativos"
)
                                }
                            >
    Inativos
    </button>

    < button
type = "button"
className = {
    filtroRegistos ===
    "todos"
    ? "gestao-btn gestao-btn-primario"
    : "gestao-btn gestao-btn-secundario"
                                }
onClick = {() =>
mudarFiltro(
    "todos"
)
                                }
                            >
    Todos
    </button>
    </div>

    < div
style = {{
    display:
    "flex",
        alignItems:
    "center",
        gap:
    "18px",
        color:
    "#64748b",
        fontSize:
    "13px",
                            }}
                        >
    <span>
    Clientes
inativos: { " " }
<strong
                                    style={
    {
        color:
        "#334155",
                                    }
}
                                >
{
    clientesInativos.length
}
    </strong>
    </span>

    <span>
Projetos
inativos: { " " }
<strong
                                    style={
    {
        color:
        "#334155",
                                    }
}
                                >
{
    projetosInativos.length
}
    </strong>
    </span>
    </div>
    </section>

{
    sucesso && (
        <div className="gestao-sucesso" >
        {
            sucesso
        }
            </div>
                    )
}

{
    erro &&
    modal ===
    null && (
        <div className="gestao-erro" >
        {
            erro
        }
            </div>
                        )
}

{
    carregando ? (
        <div className= "gestao-estado-vazio" >
        <FolderKanban
                                size={
        38
    }
                            />

        <strong>
    A
                                carregar...
    </strong>

        <span>
                                Estamos a
                                obter os
                                dados da
    plataforma.
                            </span>
        </div>
                    ) : dadosFiltrados.length ===
        0 ? (
            <div className= "gestao-estado-vazio" >
    <Search
                                size={
        38
    }
                            />

        <strong>
    {
        pesquisa
            ? "Nenhum resultado encontrado"
            : filtroRegistos ===
                "inativos"
                ? "Não existem registos inativos"
                : filtroRegistos ===
                    "ativos"
                    ? "Não existem registos ativos"
                    : "Ainda não existem registos"
    }
    </strong>

        <span>
    {
        pesquisa
            ? "Tente alterar os termos da pesquisa."
            : filtroRegistos ===
                "inativos"
                ? "Quando desativar clientes ou projetos, eles aparecerão aqui."
                : "Comece por criar um novo cliente."
    }
    </span>
        </div>
                    ) : (
        <section className= "gestao-clientes-lista" >
        {
            dadosFiltrados.map(
                ({
                    cliente,
                    projetos:
                    projetosCliente,
                }) => {
                    const clienteAberto =
                        clientesAbertos.includes(
                            cliente.idCliente
                        ) ||
                        Boolean(
                            pesquisaNormalizada
                        );

                    return (
                        <article
                                            className= "gestao-cliente-card"
                    key = {
                        cliente.idCliente
                    }
                        >
                        <div className="gestao-cliente-header" >
                            <button
                                                    type="button"
                    onClick = {() =>
                    alternarCliente(
                        cliente.idCliente
                    )
                }
                                                    style = {{
                minWidth: 0,
                flex: 1,
                display: "flex",
                alignItems: "center",
                padding: 0,
                border: 0,
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                color: "inherit",
                font: "inherit",
            }}
        >
        <div className="gestao-cliente-header-esquerda" >
            <div className="gestao-cliente-avatar" >
                <UserRound
                                                                size={
        22
    }
                                                            />
        </div>

        < div >
        <strong>
        {
            cliente.nome
        }
        </strong>

        <span>
    {
        cliente.empresa ||
        cliente.email ||
        "Cliente"
    }

    {
        !cliente.ativo &&
        " · INATIVO"
    }
    </span>
        </div>
        </div>
        </button>

        < div className = "gestao-cliente-header-direita" >
        { podeGerirProjetos &&
            cliente.ativo && (
                <>
                <button
                                                                    type="button"
    className = "gestao-abrir-projeto"
    onClick = {() =>
    abrirEditarCliente(
        cliente
    )
}
                                                                >
    <Pencil
                                                                        size={
    15
}
                                                                    />
Editar
    </button>

    < button
type = "button"
className = "gestao-abrir-projeto"
onClick = {() =>
void desativarCliente(
    cliente
)
                                                                    }
                                                                >
    <Power
                                                                        size={
    15
}
                                                                    />
Desativar
    </button>
    </>
                                                        )}

{
    podeGerirProjetos &&
    !cliente.ativo && (
        <>
        <button
                                                                    type="button"
    className = "gestao-abrir-projeto"
    onClick = {() =>
    void reativarCliente(
        cliente
    )
}
                                                                >
    <RefreshCcw
                                                                        size={
    15
}
                                                                    />
Reativar
    </button>

{
    eAdministrador && (
        <button
                                                                        type="button"
    className = "gestao-abrir-projeto"
    onClick = {() =>
    void excluirClientePermanente(
        cliente
    )
}
                                                                    >
    <Trash2
                                                                            size={
    15
}
                                                                        />
Excluir
    </button>
                                                                )}
</>
                                                        )}

<span className="gestao-contador" >
{
    projetosCliente.length
}{ " " }
{
    projetosCliente.length ===
    1
    ? "projeto"
    : "projetos"
}
</span>

    < button
type = "button"
onClick = {() =>
alternarCliente(
    cliente.idCliente
)
                                                        }
style = {{
    width: "34px",
        height: "34px",
            display: "inline-flex",
                alignItems: "center",
                    justifyContent: "center",
                        flexShrink: 0,
                            padding: 0,
                                border: 0,
                                    borderRadius: "8px",
                                        background: "transparent",
                                            color: "inherit",
                                                cursor: "pointer",
                                                        }}
title = {
    clienteAberto
    ? "Recolher cliente"
        : "Expandir cliente"
}
    >
    {
        clienteAberto?(
                                                            <ChevronDown
                                                                size = {
                21
                                                                }
                />
                                                        ): (
                <ChevronRight
                                                                size = {
                    21
                }
                                                            />
                                                        )}
</button>
    </div>
    </div>

{
    clienteAberto && (
        <div className="gestao-projetos-cliente" >
        {
            projetosCliente.length ===
                0 ? (
                    <div className= "gestao-sem-projetos" >
                    { filtroRegistos ===
                        "inativos"
                ? "Este cliente não possui projetos inativos."
                : "Este cliente ainda não possui projetos."}
            </div>
                                                    ) : (
        projetosCliente.map(
            (
                projeto
            ) => {
                const tarefasProjeto =
                    obterTarefasProjeto(
                        projeto.idProjeto
                    );

                const projetoAberto =
                    projetosAbertos.includes(
                        projeto.idProjeto
                    ) ||
                    Boolean(
                        pesquisaNormalizada
                    );

                return (
                    <div
                                                                        className= "gestao-projeto-card"
                key = {
                    projeto.idProjeto
                }
                    >
                    <div className="gestao-projeto-header" >
                        <button
                                                                                type="button"
                className = "gestao-projeto-toggle"
                onClick = {() =>
                alternarProjeto(
                    projeto.idProjeto
                )
            }
                                                                            >
            {
                projetoAberto?(
                                                                                    <ChevronDown
                                                                                        size = {
                        19
                                                                                        }
                        />
                                                                                ): (
                        <ChevronRight
                                                                                        size = {
                            19
                        }
                                                                                    />
                                                                                )}

<div className="gestao-projeto-identificacao" >
    <strong>
    {
        projeto.codigo
    }
    </strong>

    <span>
{
    projeto.nome
}
</span>
    </div>
    </button>

    < div className = "gestao-projeto-acoes" >
        <span
                                                                                    className={
    `gestao-status ${projeto.ativo
        ? classeEstadoProjeto(
            projeto.estado
        )
        : "status-danger"
    }`
}
                                                                                >
{
    projeto.ativo
        ? projeto.estado
        : "Inativo"
}
    </span>

    < span className = "gestao-tarefas-contador" >
    {
        tarefasProjeto.length
    }{ " " }
{
    tarefasProjeto.length ===
    1
    ? "tarefa"
    : "tarefas"
}
</span>

{
    projeto.ativo && (
        <button
                                                                                        type="button"
    className = "gestao-abrir-projeto"
    onClick = {() =>
    navigate(
        `/projetos/${projeto.idProjeto}`
    )
}
                                                                                    >
    Abrir
    </button>
                                                                                )}

{
    podeGerirProjetos &&
    projeto.ativo && (
        <>
        <button
                                                                                                type="button"
    className = "gestao-abrir-projeto"
    title = "Editar projeto"
    onClick = {() =>
    abrirEditarProjeto(
        projeto
    )
}
                                                                                            >
    <Pencil
                                                                                                    size={
    15
}
                                                                                                />
    </button>

    < button
type = "button"
className = "gestao-abrir-projeto"
title = "Desativar projeto"
onClick = {() =>
void desativarProjeto(
    projeto
)
                                                                                                }
                                                                                            >
    <Power
                                                                                                    size={
    15
}
                                                                                                />
    </button>
    </>
                                                                                    )}

{
    podeGerirProjetos &&
    !projeto.ativo && (
        <button
                                                                                            type="button"
    className = "gestao-abrir-projeto"
    title = "Reativar projeto"
    onClick = {() =>
    void reativarProjeto(
        projeto
    )
}
                                                                                        >
    <RefreshCcw
                                                                                                size={
    15
}
                                                                                            />
    </button>
                                                                                    )}

{
    eAdministrador &&
    !projeto.ativo && (
        <button
                                                                                            type="button"
    className = "gestao-abrir-projeto"
    title = "Excluir projeto permanentemente"
    onClick = {() =>
    void excluirProjetoPermanente(
        projeto
    )
}
                                                                                        >
    <Trash2
                                                                                                size={
    15
}
                                                                                            />
    </button>
                                                                                    )}
</div>
    </div>

{
    projetoAberto && (
        <div className="gestao-tarefas-lista" >
            {
                tarefasProjeto.length ===
                    0 ? (
                        <div className= "gestao-sem-tarefas" >
                Nenhuma
                                                                                        tarefa
                                                                                        registada
                                                                                        neste
                                                                                        projeto.
                                                                                    </div>
                                                                                ) : (
                    tarefasProjeto.map(
                        (
                            tarefa
                        ) => (
                            <button
                                                                                                type= "button"
                                                                                                className = "gestao-tarefa-item"
                                                                                                key = {
                            tarefa.idTarefa
                        }
                                                                                                onClick = {() =>
                        navigate(
                            `/projetos/${projeto.idProjeto}`
                        )
                                                                                                }
                                                                                            >
    <div className="gestao-tarefa-principal" >
        <ClipboardList
                                                                                                        size={
    17
}
                                                                                                    />

    < div >
    <strong>
    {
        tarefa.titulo
    }
    </strong>

    <span>
Prioridade: { " " }
{
    tarefa.prioridade
}
</span>
    </div>
    </div>

    < div className = "gestao-tarefa-final" >
        <span
                                                                                                        className={
    `gestao-tarefa-status ${classeEstadoTarefa(
        tarefa.estado
    )}`
}
                                                                                                    >
{
    tarefa.estado
}
    </span>

    < ChevronRight
size = {
    18
                                                                                                        }
    />
    </div>
    </button>
                                                                                        )
                                                                                    )
                                                                                )}
</div>
                                                                        )}
</div>
                                                                );
                                                            }
                                                        )
                                                    )}
</div>
                                            )}
</article>
                                    );
                                }
                            )}
</section>
                    )}
</div>
    </main>

{
    modal ===
    "cliente" && (
        <div className="gestao-modal-overlay" >
            <div className="gestao-modal" >
                <div className="gestao-modal-header" >
                    <div>
                    <span>
                    CLIENTE
                    </span>

                    <h2>
    {
        modoFormulario ===
        "editar"
        ? "Editar cliente"
        : "Novo cliente"
    }
    </h2>
        </div>

        < button
    type = "button"
    onClick = {
        fecharModal
    }
    disabled = {
        processando
    }
        >
        <X
                                        size={
        21
    }
                                    />
        </button>
        </div>

        < form
    onSubmit = {
        guardarCliente
    }
        >
        <div className="gestao-form-grid" >
            <label>
            Nome *
            <input
                                            value={
        clienteForm.nome
    }
    onChange = {(
        evento
    ) =>
    setClienteForm(
        {
            ...clienteForm,

            nome:
                evento
                    .target
                    .value,
        }
    )
}
                                        />
    </label>

    <label>
Empresa
    < input
value = {
    clienteForm.empresa
}
onChange = {(
    evento
) =>
setClienteForm(
    {
        ...clienteForm,

        empresa:
            evento
                .target
                .value,
    }
)
                                            }
                                        />
    </label>

    <label>
Email
    < input
type = "email"
value = {
    clienteForm.email
}
onChange = {(
    evento
) =>
setClienteForm(
    {
        ...clienteForm,

        email:
            evento
                .target
                .value,
    }
)
                                            }
                                        />
    </label>

    <label>
Telefone
    < input
value = {
    clienteForm.telefone
}
onChange = {(
    evento
) =>
setClienteForm(
    {
        ...clienteForm,

        telefone:
            evento
                .target
                .value,
    }
)
                                            }
                                        />
    </label>

    < label className = "gestao-form-span" >
        Morada
        < input
value = {
    clienteForm.morada
}
onChange = {(
    evento
) =>
setClienteForm(
    {
        ...clienteForm,

        morada:
            evento
                .target
                .value,
    }
)
                                            }
                                        />
    </label>

    < label className = "gestao-form-span" >
        Observações
        < textarea
rows = {
    4
                                            }
value = {
    clienteForm.observacoes
}
onChange = {(
    evento
) =>
setClienteForm(
    {
        ...clienteForm,

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

{
    erro && (
        <div className="gestao-modal-erro" >
        {
            erro
        }
            </div>
                                )
}

<div className="gestao-modal-footer" >
    <button
                                        type="button"
className = "gestao-btn gestao-btn-cancelar"
onClick = {
    fecharModal
}
disabled = {
    processando
}
    >
    Cancelar
    </button>

    < button
type = "submit"
className = "gestao-btn gestao-btn-primario"
disabled = {
    processando
}
    >
{
    processando
    ? "A guardar..."
        : modoFormulario ===
            "editar"
            ? "Guardar alterações"
            : "Criar cliente"
}
    </button>
    </div>
    </form>
    </div>
    </div>
                )}

{
    modal ===
    "projeto" && (
        <div className="gestao-modal-overlay" >
            <div className="gestao-modal gestao-modal-grande" >
                <div className="gestao-modal-header" >
                    <div>
                    <span>
                    PROJETO
                    </span>

                    <h2>
    {
        modoFormulario ===
        "editar"
        ? "Editar projeto"
        : "Novo projeto"
    }
    </h2>
        </div>

        < button
    type = "button"
    onClick = {
        fecharModal
    }
    disabled = {
        processando
    }
        >
        <X
                                        size={
        21
    }
                                    />
        </button>
        </div>

        < form
    onSubmit = {
        guardarProjeto
    }
        >
        <div className="gestao-form-grid" >
            <label>
            Cliente *
            <select
                                            value={
        projetoForm.idCliente
    }
    onChange = {(
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
    <option value="" >
        Selecione...
</option>

{
    clientesAtivos.map(
        (
            cliente
        ) => (
            <option
                                                        key= {
                cliente.idCliente
            }
                                                        value = {
            cliente.idCliente
        }
        >
        {
            cliente.nome
        }
        </option>
    )
                                            )
}
</select>
    </label>

    <label>
                                        Código do projeto
    < input
                                            value = {
        projetoForm.codigo
    }
                                            readOnly
    />
    </label>

    < label className = "gestao-form-span" >
        Nome do projeto *
            <input
                                            value= {
        projetoForm.nome
    }
                                            onChange = {(
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

    <label>
Estado *
    <select
                                            value={
    projetoForm.estado
}
onChange = {(
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
{
    estadosProjeto.map(
        (
            estado
        ) => (
            <option
                                                        key= {
                estado
            }
                                                        value = {
            estado
        }
        >
        {
            estado
        }
        </option>
    )
                                            )
}
    </select>
    </label>

    <label>
Responsável

{
    eAdministrador ? (
        <select
                                                value= {
        projetoForm.idResponsavel
    }
                                                onChange = {(
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
    <option value="" >
        Sem responsável
            </option>

{
    utilizadores.map(
        (
            item
        ) => (
            <option
                                                            key= {
                item.idUtilizador
            }
                                                            value = {
            item.idUtilizador
        }
        >
        {
            item.nome
        }
        </option>
    )
                                                )
}
</select>
                                        ) : (
    <input
                                                value= {
        projetoSelecionado?.nomeResponsavel ??
    "Sem responsável"
                                                }
disabled
    />
                                        )}
</label>

    <label>
                                        Data de início
    < input
type = "date"
value = {
    projetoForm.dataInicio
}
onChange = {(
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
    < input
type = "date"
value = {
    projetoForm.prazoPrevisto
}
onChange = {(
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

    < label className = "gestao-form-span" >
        Local
        < input
value = {
    projetoForm.localObra
}
onChange = {(
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

    < label className = "gestao-form-span" >
        Descrição
        < textarea
rows = {
    4
                                            }
value = {
    projetoForm.descricao
}
onChange = {(
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

    < label className = "gestao-form-span" >
        Observações
        < textarea
rows = {
    3
                                            }
value = {
    projetoForm.observacoes
}
onChange = {(
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

{
    erro && (
        <div className="gestao-modal-erro" >
        {
            erro
        }
            </div>
                                )
}

<div className="gestao-modal-footer" >
    <button
                                        type="button"
className = "gestao-btn gestao-btn-cancelar"
onClick = {
    fecharModal
}
disabled = {
    processando
}
    >
    Cancelar
    </button>

    < button
type = "submit"
className = "gestao-btn gestao-btn-primario"
disabled = {
    processando
}
    >
{
    processando
    ? "A guardar..."
        : modoFormulario ===
            "editar"
            ? "Guardar alterações"
            : "Criar projeto"
}
    </button>
    </div>
    </form>
    </div>
    </div>
                )}

{
    modal ===
    "tarefa" && (
        <div className="gestao-modal-overlay" >
            <div className="gestao-modal" >
                <div className="gestao-modal-header" >
                    <div>
                    <span>
                    TAREFA
                    </span>

                    <h2>
                                        Nova tarefa
        </h2>
        </div>

        < button
    type = "button"
    onClick = {
        fecharModal
    }
    disabled = {
        processando
    }
        >
        <X
                                        size={
        21
    }
                                    />
        </button>
        </div>

        < form
    onSubmit = {
        guardarTarefa
    }
        >
        <div className="gestao-form-grid" >
            <label className="gestao-form-span" >
                Projeto *
                <select
                                            value={
        tarefaForm.idProjeto
    }
    onChange = {(
        evento
    ) =>
    setTarefaForm(
        {
            ...tarefaForm,

            idProjeto:
                evento
                    .target
                    .value,
        }
    )
}
                                        >
    <option value="" >
        Selecione...
</option>

{
    projetosAtivos.map(
        (
            projeto
        ) => (
            <option
                                                        key= {
                projeto.idProjeto
            }
                                                        value = {
            projeto.idProjeto
        }
        >
        {
            projeto.codigo
        }{ " "}
                                                        —{ " "}
                                                        {
            projeto.nome
        }
        </option>
    )
                                            )
}
</select>
    </label>

    < label className = "gestao-form-span" >
        Título *
        <input
                                            value={
    tarefaForm.titulo
}
onChange = {(
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
value = {
    tarefaForm.data
}
onChange = {(
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
    < input
type = "number"
min = "0"
step = "0.25"
value = {
    tarefaForm.horas
}
onChange = {(
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
onChange = {(
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
{
    estadosTarefa.map(
        (
            estado
        ) => (
            <option
                                                        key= {
                estado
            }
                                                        value = {
            estado
        }
        >
        {
            estado
        }
        </option>
    )
                                            )
}
    </select>
    </label>

    <label>
Prioridade *
    <select
                                            value={
    tarefaForm.prioridade
}
onChange = {(
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
{
    prioridadesTarefa.map(
        (
            prioridade
        ) => (
            <option
                                                        key= {
                prioridade
            }
                                                        value = {
            prioridade
        }
        >
        {
            prioridade
        }
        </option>
    )
                                            )
}
    </select>
    </label>

    < label className = "gestao-form-span" >
        Responsável
        < select
value = {
    tarefaForm.idUtilizador
}
disabled = {
                                                !eAdministrador
                                            }
onChange = {(
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
    <option value="" >
        Sem responsável
            </option>

{
    utilizadores.map(
        (
            item
        ) => (
            <option
                                                        key= {
                item.idUtilizador
            }
                                                        value = {
            item.idUtilizador
        }
        >
        {
            item.nome
        }
        </option>
    )
                                            )
}
</select>
    </label>

    < label className = "gestao-form-span" >
        Descrição
        < textarea
rows = {
    4
                                            }
value = {
    tarefaForm.descricao
}
onChange = {(
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

{
    erro && (
        <div className="gestao-modal-erro" >
        {
            erro
        }
            </div>
                                )
}

<div className="gestao-modal-footer" >
    <button
                                        type="button"
className = "gestao-btn gestao-btn-cancelar"
onClick = {
    fecharModal
}
disabled = {
    processando
}
    >
    Cancelar
    </button>

    < button
type = "submit"
className = "gestao-btn gestao-btn-primario"
disabled = {
    processando
}
    >
{
    processando
    ? "A guardar..."
        : "Criar tarefa"
}
    </button>
    </div>
    </form>
    </div>
    </div>
                )}
</div>
    );
}