import {
    AlertCircle,
    Eye,
    KeyRound,
    Loader2,
    Mail,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
    Users,
    X,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    SyntheticEvent,
} from "react";

import AppSidebar from "../components/AppSidebar";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

import "./Utilizadores.css";

interface UtilizadorItem {
    idUtilizador: number;
    nome: string;
    email: string;
    perfil: string;
    ativo: boolean;
    dataCriacao: string;
}

interface FormUtilizador {
    nome: string;
    email: string;
    perfil: string;
    password: string;
    confirmarPassword: string;
}

type ModoModal =
    | "novo"
    | "editar"
    | "visualizar"
    | "senha"
    | null;

const formularioInicial: FormUtilizador = {
    nome: "",
    email: "",
    perfil: "Colaborador",
    password: "",
    confirmarPassword: "",
};

const perfisPermitidos = [
    "Administrador",
    "Gestor",
    "Colaborador",
];

function obterMensagemErro(erro: unknown) {
    if (erro instanceof Error) {
        return erro.message;
    }

    return "Ocorreu um erro inesperado.";
}

function formatarData(data?: string) {
    if (!data) {
        return "—";
    }

    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) {
        return data;
    }

    return new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(valor);
}

function obterIniciais(nome?: string) {
    const valor = nome?.trim();

    if (!valor) {
        return "U";
    }

    const partes = valor
        .split(/\s+/)
        .filter(Boolean);

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

export default function Utilizadores() {
    const { utilizador } = useAuth();

    const ehAdministrador =
        utilizador?.perfil === "Administrador";

    const [utilizadores, setUtilizadores] =
        useState<UtilizadorItem[]>([]);

    const [carregando, setCarregando] =
        useState(true);

    const [processando, setProcessando] =
        useState(false);

    const [erro, setErro] =
        useState("");

    const [sucesso, setSucesso] =
        useState("");

    const [pesquisa, setPesquisa] =
        useState("");

    const [filtroPerfil, setFiltroPerfil] =
        useState("Todos");

    const [modoModal, setModoModal] =
        useState<ModoModal>(null);

    const [
        utilizadorSelecionado,
        setUtilizadorSelecionado,
    ] = useState<UtilizadorItem | null>(null);

    const [formulario, setFormulario] =
        useState<FormUtilizador>(
            formularioInicial
        );

    const carregarUtilizadores =
        useCallback(async () => {
            if (!ehAdministrador) {
                setCarregando(false);
                return;
            }

            setCarregando(true);
            setErro("");

            try {
                const resposta =
                    await apiRequest<
                        UtilizadorItem[]
                    >("/Utilizadores");

                setUtilizadores(resposta);
            } catch (error) {
                setErro(
                    obterMensagemErro(error)
                );
            } finally {
                setCarregando(false);
            }
        }, [ehAdministrador]);

    useEffect(() => {
        void carregarUtilizadores();
    }, [carregarUtilizadores]);

    const utilizadoresFiltrados =
        useMemo(() => {
            const texto =
                pesquisa
                    .trim()
                    .toLowerCase();

            return utilizadores.filter(
                (item) => {
                    const correspondePesquisa =
                        !texto ||
                        item.nome
                            .toLowerCase()
                            .includes(texto) ||
                        item.email
                            .toLowerCase()
                            .includes(texto) ||
                        item.perfil
                            .toLowerCase()
                            .includes(texto);

                    const correspondePerfil =
                        filtroPerfil ===
                        "Todos" ||
                        item.perfil ===
                        filtroPerfil;

                    return (
                        correspondePesquisa &&
                        correspondePerfil
                    );
                }
            );
        }, [
            utilizadores,
            pesquisa,
            filtroPerfil,
        ]);

    const abrirNovo = () => {
        setErro("");
        setSucesso("");
        setUtilizadorSelecionado(null);
        setFormulario(formularioInicial);
        setModoModal("novo");
    };

    const abrirVisualizar = (
        item: UtilizadorItem
    ) => {
        setErro("");
        setSucesso("");
        setUtilizadorSelecionado(item);

        setFormulario({
            nome: item.nome,
            email: item.email,
            perfil: item.perfil,
            password: "",
            confirmarPassword: "",
        });

        setModoModal("visualizar");
    };

    const abrirEditar = (
        item: UtilizadorItem
    ) => {
        setErro("");
        setSucesso("");
        setUtilizadorSelecionado(item);

        setFormulario({
            nome: item.nome,
            email: item.email,
            perfil: item.perfil,
            password: "",
            confirmarPassword: "",
        });

        setModoModal("editar");
    };

    const abrirSenha = (
        item: UtilizadorItem
    ) => {
        setErro("");
        setSucesso("");
        setUtilizadorSelecionado(item);

        setFormulario({
            nome: item.nome,
            email: item.email,
            perfil: item.perfil,
            password: "",
            confirmarPassword: "",
        });

        setModoModal("senha");
    };

    const fecharModal = () => {
        if (processando) {
            return;
        }

        setModoModal(null);
        setUtilizadorSelecionado(null);
        setFormulario(formularioInicial);
    };

    const atualizarCampo = (
        campo: keyof FormUtilizador,
        valor: string
    ) => {
        setFormulario((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));
    };

    const validarFormulario = () => {
        if (modoModal === "senha") {
            if (
                formulario.password.length <
                8
            ) {
                setErro(
                    "A nova palavra-passe deve possuir pelo menos 8 caracteres."
                );

                return false;
            }

            if (
                formulario.password !==
                formulario.confirmarPassword
            ) {
                setErro(
                    "A confirmação da palavra-passe não corresponde."
                );

                return false;
            }

            return true;
        }

        if (
            !formulario.nome.trim()
        ) {
            setErro(
                "O nome do utilizador é obrigatório."
            );

            return false;
        }

        if (
            !formulario.email.trim()
        ) {
            setErro(
                "O email é obrigatório."
            );

            return false;
        }

        if (
            !perfisPermitidos.includes(
                formulario.perfil
            )
        ) {
            setErro(
                "Selecione um perfil válido."
            );

            return false;
        }

        if (modoModal === "novo") {
            if (
                formulario.password.length <
                8
            ) {
                setErro(
                    "A palavra-passe deve possuir pelo menos 8 caracteres."
                );

                return false;
            }

            if (
                formulario.password !==
                formulario.confirmarPassword
            ) {
                setErro(
                    "A confirmação da palavra-passe não corresponde."
                );

                return false;
            }
        }

        return true;
    };

    const guardar = async (
        evento: SyntheticEvent<HTMLFormElement>
    ) => {
        evento.preventDefault();

        if (!ehAdministrador) {
            setErro(
                "Apenas administradores podem gerir utilizadores."
            );

            return;
        }

        setErro("");
        setSucesso("");

        if (!validarFormulario()) {
            return;
        }

        setProcessando(true);

        try {
            if (modoModal === "novo") {
                await apiRequest(
                    "/Utilizadores",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            nome:
                                formulario.nome.trim(),
                            email:
                                formulario.email.trim(),
                            perfil:
                                formulario.perfil,
                            password:
                                formulario.password,
                        }),
                    }
                );

                setSucesso(
                    "Utilizador criado com sucesso."
                );
            }

            if (
                modoModal === "editar" &&
                utilizadorSelecionado
            ) {
                await apiRequest(
                    `/Utilizadores/${utilizadorSelecionado.idUtilizador}`,
                    {
                        method: "PUT",
                        body: JSON.stringify({
                            nome:
                                formulario.nome.trim(),
                            email:
                                formulario.email.trim(),
                            perfil:
                                formulario.perfil,
                        }),
                    }
                );

                setSucesso(
                    "Utilizador atualizado com sucesso."
                );
            }

            if (
                modoModal === "senha" &&
                utilizadorSelecionado
            ) {
                await apiRequest(
                    `/Utilizadores/${utilizadorSelecionado.idUtilizador}/senha`,
                    {
                        method: "PUT",
                        body: JSON.stringify({
                            novaPassword:
                                formulario.password,
                        }),
                    }
                );

                setSucesso(
                    "Palavra-passe alterada com sucesso."
                );
            }

            fecharModal();
            await carregarUtilizadores();
        } catch (error) {
            setErro(
                obterMensagemErro(error)
            );
        } finally {
            setProcessando(false);
        }
    };

    const desativarUtilizador =
        async (
            item: UtilizadorItem
        ) => {
            if (!ehAdministrador) {
                return;
            }

            if (
                utilizador?.idUtilizador ===
                item.idUtilizador
            ) {
                setErro(
                    "Não pode desativar a própria conta enquanto está autenticado."
                );

                return;
            }

            const primeiraConfirmacao =
                window.confirm(
                    `Deseja desativar o utilizador "${item.nome}"?`
                );

            if (!primeiraConfirmacao) {
                return;
            }

            const segundaConfirmacao =
                window.confirm(
                    "O utilizador deixará de aparecer na lista e não poderá utilizar esta conta. Confirmar?"
                );

            if (!segundaConfirmacao) {
                return;
            }

            setErro("");
            setSucesso("");
            setProcessando(true);

            try {
                await apiRequest(
                    `/Utilizadores/${item.idUtilizador}`,
                    {
                        method: "DELETE",
                    }
                );

                setSucesso(
                    "Utilizador desativado com sucesso."
                );

                await carregarUtilizadores();
            } catch (error) {
                setErro(
                    obterMensagemErro(error)
                );
            } finally {
                setProcessando(false);
            }
        };

    if (!ehAdministrador) {
        return (
            <div className= "utilizadores-shell" >
            <AppSidebar />

            < main className = "utilizadores-main" >
                <header className="utilizadores-topbar" >
                    <span>
                    Plataforma / Utilizadores
                    </span>
                    </header>

                    < div className = "utilizadores-content" >
                        <div className="utilizadores-acesso-negado" >
                            <ShieldCheck size={ 42 } />

                                <h1>
                                Acesso restrito
            </h1>

            <p>
                                O módulo de utilizadores
                                está disponível apenas
                                para administradores.
                            </p>
            </div>
            </div>
            </main>
            </div>
        );
    }

    return (
        <div className= "utilizadores-shell" >
        <AppSidebar />

        < main className = "utilizadores-main" >
            <header className="utilizadores-topbar" >
                <div>
                <span>
                Plataforma / Utilizadores
                </span>
                </div>

                < div className = "utilizadores-topbar-info" >
                    <ShieldCheck size={ 18 } />
                        <span>
    Administração
        </span>
        </div>
        </header>

        < div className = "utilizadores-content" >
            <section className="utilizadores-header" >
                <div>
                <span className="utilizadores-eyebrow" >
                    ADMINISTRAÇÃO
                    </span>

                    <h1>
    Utilizadores
        </h1>

        <p>
                                Faça a gestão das
                                contas e dos perfis de
                                acesso à plataforma.
                            </p>
        </div>

        < div className = "utilizadores-header-actions" >
            <button
                                type="button"
    className = "utilizadores-btn-secundario"
    onClick = {() =>
    void carregarUtilizadores()
}
disabled = { carregando }
    >
    <RefreshCw
                                    size={ 17 }
className = {
    carregando
    ? "utilizadores-rotating"
        : ""
}
    />

    Atualizar
    </button>

    < button
type = "button"
className = "utilizadores-btn-primary"
onClick = { abrirNovo }
    >
    <Plus size={ 18 } />
                                Novo utilizador
    </button>
    </div>
    </section>

{
    erro && (
        <div className="utilizadores-alerta utilizadores-alerta-erro" >
            <AlertCircle
                                size={ 18 }
                            />

        <span>
    { erro }
    </span>
        </div>
                    )
}

{
    sucesso && (
        <div className="utilizadores-alerta utilizadores-alerta-sucesso" >
            <ShieldCheck
                                size={ 18 }
                            />

        <span>
    { sucesso }
    </span>
        </div>
                    )
}

<section className="utilizadores-estatisticas" >
    <article>
    <div>
    <Users size={ 21 } />
        </div>

        <span>
                                Utilizadores ativos
    </span>

    <strong>
{
    carregando
        ? "..."
        : utilizadores.length
}
</strong>
    </article>

    < article >
    <div>
    <ShieldCheck
                                    size={ 21 }
                                />
    </div>

    <span>
Administradores
    </span>

    <strong>
{
    carregando
        ? "..."
        : utilizadores.filter(
            (
                item
            ) =>
                item.perfil ===
                "Administrador"
        ).length
}
</strong>
    </article>

    < article >
    <div>
    <UserRound
                                    size={ 21 }
                                />
    </div>

    <span>
Gestores
    </span>

    <strong>
{
    carregando
        ? "..."
        : utilizadores.filter(
            (
                item
            ) =>
                item.perfil ===
                "Gestor"
        ).length
}
</strong>
    </article>

    < article >
    <div>
    <UserRound
                                    size={ 21 }
                                />
    </div>

    <span>
Colaboradores
    </span>

    <strong>
{
    carregando
        ? "..."
        : utilizadores.filter(
            (
                item
            ) =>
                item.perfil ===
                "Colaborador"
        ).length
}
</strong>
    </article>
    </section>

    < section className = "utilizadores-painel" >
        <div className="utilizadores-filtros" >
            <div className="utilizadores-pesquisa" >
                <Search size={ 18 } />

                    < input
type = "text"
placeholder = "Pesquisar por nome, email ou perfil..."
value = { pesquisa }
onChange = {(evento) =>
setPesquisa(
    evento
        .target
        .value
)
                                    }
                                />
    </div>

    < select
value = { filtroPerfil }
onChange = {(evento) =>
setFiltroPerfil(
    evento.target
        .value
)
                                }
                            >
    <option value="Todos" >
        Todos os perfis
            </option>

{
    perfisPermitidos.map(
        (perfil) => (
            <option
                                            key= {
            perfil
        }
                                            value = {
            perfil
        }
        >
        { perfil }
        </option>
    )
                                )
}
</select>
    </div>

    < div className = "utilizadores-tabela-wrapper" >
        <table className="utilizadores-tabela" >
            <thead>
            <tr>
            <th>
            Utilizador
            </th>

            <th>
Email
    </th>

    <th>
Perfil
    </th>

    <th>
                                            Criado em
    </th>

    <th>
Estado
    </th>

    < th className = "utilizadores-coluna-acoes" >
        Ações
        </th>
        </tr>
        </thead>

        <tbody>
{
    carregando ? (
        <tr>
        <td
                                                colSpan= {
            6
                                                }
        >
        <div className="utilizadores-estado-tabela" >
            <Loader2
                                                        className="utilizadores-rotating"
    size = {
        24
                                                        }
        />

        <span>
        A carregar
                                                        utilizadores...
    </span>
        </div>
        </td>
        </tr>
                                    ) : utilizadoresFiltrados.length ===
        0 ? (
            <tr>
            <td
                                                colSpan= {
        6
                                                }
    >
    <div className="utilizadores-estado-tabela" >
        <Users
                                                        size={
        28
    }
                                                    />

        <strong>
    Nenhum
    utilizador
    encontrado
        </strong>

        <span>
    Não
    existem
    registos
    que
    correspondam
    aos
    filtros.
                                                    </span>
        </div>
        </td>
        </tr>
                                    ) : (
        utilizadoresFiltrados.map(
            (
                item
            ) => (
                <tr
                                                    key= {
                    item.idUtilizador
                }
                >
                <td>
                <div className="utilizadores-identidade" >
        <div className="utilizadores-avatar" >
        {
            obterIniciais(
                item.nome
                                                                )}
</div>

    < div >
    <strong>
    {
        item.nome
    }
    </strong>

{
    utilizador?.idUtilizador ===
    item.idUtilizador && (
        <span>
        Conta
                                                                            atual
        </span>
                                                                    )
}
</div>
    </div>
    </td>

    < td >
    <div className="utilizadores-email" >
        <Mail
                                                                size={
    15
}
                                                            />

    <span>
{
    item.email
}
</span>
    </div>
    </td>

    < td >
    <span
                                                            className={
    `utilizadores-perfil utilizadores-perfil-${item.perfil
        .toLowerCase()
        .replace(
            "administrador",
            "admin"
        )}`
}
                                                        >
{
    item.perfil
}
    </span>
    </td>

    <td>
{
    formatarData(
        item.dataCriacao
    )
}
</td>

    < td >
    <span className="utilizadores-estado-ativo" >
        Ativo
        </span>
        </td>

        < td >
        <div className="utilizadores-acoes" >
            <button
                                                                type="button"
title = "Visualizar"
onClick = {() =>
abrirVisualizar(
    item
)
                                                                }
                                                            >
    <Eye
                                                                    size={
    16
}
                                                                />
    </button>

    < button
type = "button"
title = "Editar"
onClick = {() =>
abrirEditar(
    item
)
                                                                }
                                                            >
    <Pencil
                                                                    size={
    16
}
                                                                />
    </button>

    < button
type = "button"
title = "Alterar palavra-passe"
onClick = {() =>
abrirSenha(
    item
)
                                                                }
                                                            >
    <KeyRound
                                                                    size={
    16
}
                                                                />
    </button>

    < button
type = "button"
className = "utilizadores-acao-perigo"
title = {
    utilizador?.idUtilizador ===
    item.idUtilizador
    ? "Não pode desativar a própria conta"
    : "Desativar"
                                                                }
disabled = {
    processando ||
    utilizador?.idUtilizador ===
    item.idUtilizador
                                                                }
onClick = {() =>
void desativarUtilizador(
    item
)
                                                                }
                                                            >
    <Trash2
                                                                    size={
    16
}
                                                                />
    </button>
    </div>
    </td>
    </tr>
                                            )
                                        )
                                    )}
</tbody>
    </table>
    </div>

    < div className = "utilizadores-rodape-tabela" >
        <span>
        {
            utilizadoresFiltrados.length
        }{ " " }
utilizador(es)
apresentado(s)
    </span>
    </div>
    </section>
    </div>
    </main>

{
    modoModal && (
        <div
                    className="utilizadores-modal-overlay"
    onMouseDown = {
        fecharModal
    }
        >
        <div
                        className="utilizadores-modal"
    onMouseDown = {(
        evento
    ) =>
    evento.stopPropagation()
}
                    >
    <div className="utilizadores-modal-header" >
        <div>
        <span className="utilizadores-modal-eyebrow" >
        { modoModal ===
            "novo"
            ? "NOVO REGISTO"
            : modoModal ===
                "editar"
                ? "EDITAR UTILIZADOR"
                : modoModal ===
                    "senha"
                    ? "SEGURANÇA"
                    : "DETALHES"}
</span>

    <h2>
{
    modoModal ===
    "novo"
    ? "Novo utilizador"
    : modoModal ===
        "editar"
        ? "Editar utilizador"
        : modoModal ===
            "senha"
            ? "Alterar palavra-passe"
            : "Detalhes do utilizador"
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
    <X size={ 20 } />
        </button>
        </div>

{
    modoModal ===
    "visualizar" ? (
        <div className= "utilizadores-detalhes" >
<div className="utilizadores-detalhes-avatar" >
{
    obterIniciais(
        utilizadorSelecionado?.nome
    )
}
    </div>

    <h3>
    {
        utilizadorSelecionado?.nome
    }
    </h3>

        <span>
    {
        utilizadorSelecionado?.perfil
    }
    </span>

        < dl >
        <div>
        <dt>
        Email
        </dt>

        <dd>
    {
        utilizadorSelecionado?.email
    }
    </dd>
        </div>

        < div >
        <dt>
        Estado
        </dt>

        <dd>
    Ativo
        </dd>
        </div>

        < div >
        <dt>
        Data de
    criação
        </dt>

        <dd>
    {
        formatarData(
            utilizadorSelecionado?.dataCriacao
        )
    }
    </dd>
        </div>

        < div >
        <dt>
        ID
        </dt>

        <dd>
                                            #
    {
        utilizadorSelecionado?.idUtilizador
    }
    </dd>
        </div>
        </dl>

        < div className = "utilizadores-modal-footer" >
            <button
                                        type="button"
    className = "utilizadores-btn-secundario"
    onClick = {
        fecharModal
    }
        >
        Fechar
        </button>
        </div>
        </div>
                        ) : (
        <form
                                onSubmit= {
        guardar
    }
    className = "utilizadores-form"
        >
    { modoModal ===
        "senha" ? (
            <>
            <div className= "utilizadores-senha-utilizador" >
    <KeyRound
                                                size={
        22
    }
                                            />

        < div >
        <strong>
        {
            utilizadorSelecionado?.nome
        }
        </strong>

        <span>
    {
        utilizadorSelecionado?.email
    }
    </span>
        </div>
        </div>

        <label>
    Nova
    palavra - passe

        < input
    type = "password"
    value = {
        formulario.password
    }
    onChange = {(
        evento
    ) =>
    atualizarCampo(
        "password",
        evento
            .target
            .value
    )
}
minLength = {
    8
                                                }
autoComplete = "new-password"
required
    />

    <small>
    Mínimo
                                                de 8
caracteres.
                                            </small>
    </label>

    <label>
Confirmar
nova
palavra - passe

    < input
type = "password"
value = {
    formulario.confirmarPassword
}
onChange = {(
    evento
) =>
atualizarCampo(
    "confirmarPassword",
    evento
        .target
        .value
)
                                                }
minLength = {
    8
                                                }
autoComplete = "new-password"
required
    />
    </label>
    </>
                                ) : (
    <>
    <label>
    Nome

    < input
                                                type = "text"
value = {
    formulario.nome
}
onChange = {(
    evento
) =>
atualizarCampo(
    "nome",
    evento
        .target
        .value
)
                                                }
maxLength = {
    150
                                                }
required
    />
    </label>

    <label>
Email

    < input
type = "email"
value = {
    formulario.email
}
onChange = {(
    evento
) =>
atualizarCampo(
    "email",
    evento
        .target
        .value
)
                                                }
required
    />
    </label>

    <label>
Perfil

    < select
value = {
    formulario.perfil
}
onChange = {(
    evento
) =>
atualizarCampo(
    "perfil",
    evento
        .target
        .value
)
                                                }
required
    >
{
    perfisPermitidos.map(
        (
            perfil
        ) => (
            <option
                                                            key= {
                perfil
            }
                                                            value = {
            perfil
        }
        >
        {
            perfil
        }
        </option>
    )
                                                )
}
    </select>
    </label>

{
    modoModal ===
    "novo" && (
        <>
        <label>
        Palavra - passe

        < input
                                                            type = "password"
    value = {
        formulario.password
    }
    onChange = {(
        evento
    ) =>
    atualizarCampo(
        "password",
        evento
            .target
            .value
    )
}
minLength = {
    8
                                                            }
autoComplete = "new-password"
required
    />

    <small>
    Mínimo
                                                            de 8
caracteres.
                                                        </small>
    </label>

    <label>
Confirmar
palavra - passe

    < input
type = "password"
value = {
    formulario.confirmarPassword
}
onChange = {(
    evento
) =>
atualizarCampo(
    "confirmarPassword",
    evento
        .target
        .value
)
                                                            }
minLength = {
    8
                                                            }
autoComplete = "new-password"
required
    />
    </label>
    </>
                                            )}
</>
                                )}

<div className="utilizadores-modal-footer" >
    <button
                                        type="button"
className = "utilizadores-btn-secundario"
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
className = "utilizadores-btn-primary"
disabled = {
    processando
}
    >
{
    processando?(
                                            <>
    <Loader2
                                                    className="utilizadores-rotating"
size = {
    17
                                                    }
    />

    A guardar...
</>
                                        ) : modoModal ===
    "novo" ? (
    "Criar utilizador"
) : modoModal ===
    "senha" ? (
    "Alterar palavra-passe"
) : (
    "Guardar alterações"
)}
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