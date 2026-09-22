import {
    AlertCircle,
    Camera,
    CheckCircle2,
    KeyRound,
    Loader2,
    LockKeyhole,
    Mail,
    Save,
    ShieldCheck,
    Trash2,
    Upload,
    UserRound,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import type {
    ChangeEvent,
    SyntheticEvent,
} from "react";

import AppSidebar from "../components/AppSidebar";

import {
    useAuth,
} from "../contexts/AuthContext";

import {
    apiBlob,
    apiFormData,
    apiRequest,
} from "../services/api";

import "./MeuPerfil.css";

/* =========================================================
   TIPOS
   ========================================================= */

interface MeuPerfilResponse {
    idUtilizador: number;
    nome: string;
    email: string;
    perfil: string;
    ativo: boolean;
    dataCriacao: string;
    temFotoPerfil: boolean;
}

interface FormPerfil {
    nome: string;
    email: string;
}

interface FormSenha {
    novaPassword: string;
    confirmarPassword: string;
}

/* =========================================================
   CONSTANTES
   ========================================================= */

const TAMANHO_MAXIMO_FOTO =
    5 * 1024 * 1024;

const TIPOS_FOTO_PERMITIDOS = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */

function obterMensagemErro(
    erro: unknown,
) {
    if (erro instanceof Error) {
        return erro.message;
    }

    return "Ocorreu um erro inesperado.";
}

function obterIniciais(
    nome?: string,
) {
    const valor =
        nome?.trim();

    if (!valor) {
        return "U";
    }

    const partes =
        valor
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
}

function formatarData(
    data?: string,
) {
    if (!data) {
        return "—";
    }

    const valor =
        new Date(data);

    if (
        Number.isNaN(
            valor.getTime(),
        )
    ) {
        return data;
    }

    return new Intl.DateTimeFormat(
        "pt-PT",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        },
    ).format(valor);
}

function formatarTamanho(
    bytes: number,
) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (
        bytes <
        1024 * 1024
    ) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;
}

/* =========================================================
   COMPONENTE
   ========================================================= */

export default function MeuPerfil() {
    const {
        utilizador,
        atualizarUtilizador,
    } = useAuth();

    const inputFotoRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const atualizarUtilizadorRef =
        useRef(atualizarUtilizador);

    const urlFotoRef =
        useRef<string | null>(
            null,
        );

    const [
        perfil,
        setPerfil,
    ] =
        useState<MeuPerfilResponse | null>(
            null,
        );

    const [
        formulario,
        setFormulario,
    ] =
        useState<FormPerfil>({
            nome: "",
            email: "",
        });

    const [
        formularioSenha,
        setFormularioSenha,
    ] =
        useState<FormSenha>({
            novaPassword: "",
            confirmarPassword: "",
        });

    const [
        fotoUrl,
        setFotoUrl,
    ] =
        useState<string | null>(
            null,
        );

    const [
        fotoSelecionada,
        setFotoSelecionada,
    ] =
        useState<File | null>(
            null,
        );

    const [
        previewFoto,
        setPreviewFoto,
    ] =
        useState<string | null>(
            null,
        );

    const [
        carregando,
        setCarregando,
    ] =
        useState(true);

    const [
        salvandoPerfil,
        setSalvandoPerfil,
    ] =
        useState(false);

    const [
        salvandoFoto,
        setSalvandoFoto,
    ] =
        useState(false);

    const [
        removendoFoto,
        setRemovendoFoto,
    ] =
        useState(false);

    const [
        salvandoSenha,
        setSalvandoSenha,
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

    /* =========================================================
       LIMPAR URL DA FOTO
       ========================================================= */

    const limparUrlFoto =
        useCallback(() => {
            if (
                urlFotoRef.current
            ) {
                URL.revokeObjectURL(
                    urlFotoRef.current,
                );

                urlFotoRef.current =
                    null;
            }
        }, []);

    /* =========================================================
       CARREGAR FOTO PROTEGIDA
       ========================================================= */

    const carregarFoto =
        useCallback(
            async (
                temFoto: boolean,
            ) => {
                limparUrlFoto();

                if (!temFoto) {
                    setFotoUrl(null);
                    return;
                }

                try {
                    const blob =
                        await apiBlob(
                            "/Utilizadores/meu-perfil/foto",
                        );

                    const url =
                        URL.createObjectURL(
                            blob,
                        );

                    urlFotoRef.current =
                        url;

                    setFotoUrl(url);
                } catch {
                    setFotoUrl(null);
                }
            },
            [limparUrlFoto],
        );

    /* =========================================================
       CARREGAR PERFIL
       ========================================================= */

    const carregarPerfil =
        useCallback(
            async () => {
                setCarregando(true);
                setErro("");

                try {
                    const dados =
                        await apiRequest<MeuPerfilResponse>(
                            "/Utilizadores/meu-perfil",
                        );

                    setPerfil(dados);

                    setFormulario({
                        nome:
                            dados.nome ??
                            "",
                        email:
                            dados.email ??
                            "",
                    });

                    atualizarUtilizadorRef.current({
                        idUtilizador:
                            dados.idUtilizador,
                        nome:
                            dados.nome,
                        email:
                            dados.email,
                        perfil:
                            dados.perfil,
                    });

                    await carregarFoto(
                        dados.temFotoPerfil,
                    );
                } catch (error) {
                    setErro(
                        obterMensagemErro(
                            error,
                        ),
                    );
                } finally {
                    setCarregando(false);
                }
            },
            [
                carregarFoto,
            ],
        );

    useEffect(() => {
        atualizarUtilizadorRef.current =
            atualizarUtilizador;
    }, [atualizarUtilizador]);

    useEffect(() => {
        void carregarPerfil();

        return () => {
            limparUrlFoto();
        };
    }, [
        carregarPerfil,
        limparUrlFoto,
    ]);

    /* =========================================================
       ALTERAR CAMPOS DO PERFIL
       ========================================================= */

    const atualizarCampoPerfil =
        (
            campo:
                keyof FormPerfil,
            valor: string,
        ) => {
            setFormulario(
                (anterior) => ({
                    ...anterior,
                    [campo]: valor,
                }),
            );
        };

    /* =========================================================
       GUARDAR NOME / EMAIL
       ========================================================= */

    const guardarPerfil =
        async (
            evento:
                SyntheticEvent<HTMLFormElement>,
        ) => {
            evento.preventDefault();

            setErro("");
            setSucesso("");

            const nome =
                formulario.nome.trim();

            const email =
                formulario.email.trim();

            if (!nome) {
                setErro(
                    "O nome é obrigatório.",
                );

                return;
            }

            if (!email) {
                setErro(
                    "O email é obrigatório.",
                );

                return;
            }

            setSalvandoPerfil(true);

            try {
                const resposta =
                    await apiRequest<MeuPerfilResponse>(
                        "/Utilizadores/meu-perfil",
                        {
                            method: "PUT",

                            body:
                                JSON.stringify(
                                    {
                                        nome,
                                        email,
                                    },
                                ),
                        },
                    );

                setPerfil(resposta);

                setFormulario({
                    nome:
                        resposta.nome,
                    email:
                        resposta.email,
                });

                atualizarUtilizador({
                    idUtilizador:
                        resposta.idUtilizador,
                    nome:
                        resposta.nome,
                    email:
                        resposta.email,
                    perfil:
                        resposta.perfil,
                });

                setSucesso(
                    "Os dados do perfil foram atualizados com sucesso.",
                );
            } catch (error) {
                setErro(
                    obterMensagemErro(
                        error,
                    ),
                );
            } finally {
                setSalvandoPerfil(
                    false,
                );
            }
        };

    /* =========================================================
       SELECIONAR FOTO
       ========================================================= */

    const selecionarFoto =
        (
            evento:
                ChangeEvent<HTMLInputElement>,
        ) => {
            setErro("");
            setSucesso("");

            const arquivo =
                evento.target
                    .files?.[0];

            if (!arquivo) {
                return;
            }

            if (
                !TIPOS_FOTO_PERMITIDOS.includes(
                    arquivo.type,
                )
            ) {
                setErro(
                    "Selecione uma imagem JPG, PNG ou WebP.",
                );

                evento.target.value =
                    "";

                return;
            }

            if (
                arquivo.size >
                TAMANHO_MAXIMO_FOTO
            ) {
                setErro(
                    "A fotografia não pode ultrapassar 5 MB.",
                );

                evento.target.value =
                    "";

                return;
            }

            if (previewFoto) {
                URL.revokeObjectURL(
                    previewFoto,
                );
            }

            const preview =
                URL.createObjectURL(
                    arquivo,
                );

            setFotoSelecionada(
                arquivo,
            );

            setPreviewFoto(
                preview,
            );
        };

    /* =========================================================
       CANCELAR FOTO SELECIONADA
       ========================================================= */

    const cancelarFotoSelecionada =
        () => {
            if (previewFoto) {
                URL.revokeObjectURL(
                    previewFoto,
                );
            }

            setPreviewFoto(null);
            setFotoSelecionada(null);

            if (
                inputFotoRef.current
            ) {
                inputFotoRef.current.value =
                    "";
            }
        };

    /* =========================================================
       ENVIAR FOTO
       ========================================================= */

    const guardarFoto =
        async () => {
            if (!fotoSelecionada) {
                setErro(
                    "Selecione uma fotografia antes de guardar.",
                );

                return;
            }

            setErro("");
            setSucesso("");
            setSalvandoFoto(true);

            try {
                const formData =
                    new FormData();

                formData.append(
                    "foto",
                    fotoSelecionada,
                );

                const resposta =
                    await apiFormData<MeuPerfilResponse>(
                        "/Utilizadores/meu-perfil/foto",
                        formData,
                    );

                setPerfil(resposta);

                cancelarFotoSelecionada();

                await carregarFoto(
                    true,
                );

                setSucesso(
                    "Fotografia de perfil atualizada com sucesso.",
                );
            } catch (error) {
                setErro(
                    obterMensagemErro(
                        error,
                    ),
                );
            } finally {
                setSalvandoFoto(
                    false,
                );
            }
        };

    /* =========================================================
       REMOVER FOTO
       ========================================================= */

    const removerFoto =
        async () => {
            if (
                !perfil?.temFotoPerfil
            ) {
                return;
            }

            const confirmar =
                window.confirm(
                    "Deseja remover a fotografia do perfil?",
                );

            if (!confirmar) {
                return;
            }

            setErro("");
            setSucesso("");
            setRemovendoFoto(true);

            try {
                await apiRequest<void>(
                    "/Utilizadores/meu-perfil/foto",
                    {
                        method: "DELETE",
                    },
                );

                limparUrlFoto();

                setFotoUrl(null);

                setPerfil(
                    (anterior) =>
                        anterior
                            ? {
                                ...anterior,
                                temFotoPerfil:
                                    false,
                            }
                            : anterior,
                );

                cancelarFotoSelecionada();

                setSucesso(
                    "Fotografia removida com sucesso.",
                );
            } catch (error) {
                setErro(
                    obterMensagemErro(
                        error,
                    ),
                );
            } finally {
                setRemovendoFoto(
                    false,
                );
            }
        };

    /* =========================================================
       ALTERAR PALAVRA-PASSE
       ========================================================= */

    const guardarSenha =
        async (
            evento:
                SyntheticEvent<HTMLFormElement>,
        ) => {
            evento.preventDefault();

            setErro("");
            setSucesso("");

            if (
                formularioSenha
                    .novaPassword
                    .length < 8
            ) {
                setErro(
                    "A nova palavra-passe deve possuir pelo menos 8 caracteres.",
                );

                return;
            }

            if (
                formularioSenha
                    .novaPassword !==
                formularioSenha
                    .confirmarPassword
            ) {
                setErro(
                    "A confirmação da palavra-passe não corresponde.",
                );

                return;
            }

            if (!perfil) {
                setErro(
                    "Não foi possível identificar o utilizador.",
                );

                return;
            }

            setSalvandoSenha(true);

            try {
                await apiRequest<void>(
                    `/Utilizadores/${perfil.idUtilizador}/senha`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify(
                                {
                                    novaPassword:
                                        formularioSenha.novaPassword,
                                },
                            ),
                    },
                );

                setFormularioSenha({
                    novaPassword: "",
                    confirmarPassword:
                        "",
                });

                setSucesso(
                    "Palavra-passe alterada com sucesso.",
                );
            } catch (error) {
                setErro(
                    obterMensagemErro(
                        error,
                    ),
                );
            } finally {
                setSalvandoSenha(
                    false,
                );
            }
        };

    /* =========================================================
       CARREGAMENTO
       ========================================================= */

    if (carregando) {
        return (
            <div className="meu-perfil-shell">
                <AppSidebar />

                <main className="meu-perfil-main">
                    <header className="meu-perfil-topbar">
                        <span>
                            Plataforma / Meu Perfil
                        </span>
                    </header>

                    <div className="meu-perfil-loading">
                        <Loader2
                            size={28}
                            className="meu-perfil-rotating"
                        />

                        <span>
                            A carregar perfil...
                        </span>
                    </div>
                </main>
            </div>
        );
    }

    /* =========================================================
       PÁGINA
       ========================================================= */

    return (
        <div className="meu-perfil-shell">
            <AppSidebar />

            <main className="meu-perfil-main">
                <header className="meu-perfil-topbar">
                    <div>
                        <span>
                            Plataforma / Meu Perfil
                        </span>
                    </div>

                    <div className="meu-perfil-topbar-info">
                        <ShieldCheck
                            size={18}
                        />

                        <span>
                            Conta pessoal
                        </span>
                    </div>
                </header>

                <div className="meu-perfil-content">
                    <section className="meu-perfil-header">
                        <div>
                            <span className="meu-perfil-eyebrow">
                                CONTA
                            </span>

                            <h1>
                                Meu Perfil
                            </h1>

                            <p>
                                Gerencie os seus dados pessoais,
                                fotografia e segurança da conta.
                            </p>
                        </div>
                    </section>

                    {erro && (
                        <div className="meu-perfil-alerta meu-perfil-alerta-erro">
                            <AlertCircle
                                size={18}
                            />

                            <span>
                                {erro}
                            </span>
                        </div>
                    )}

                    {sucesso && (
                        <div className="meu-perfil-alerta meu-perfil-alerta-sucesso">
                            <CheckCircle2
                                size={18}
                            />

                            <span>
                                {sucesso}
                            </span>
                        </div>
                    )}

                    <div className="meu-perfil-grid">
                        {/* =====================================
                            COLUNA ESQUERDA
                            ===================================== */}

                        <aside className="meu-perfil-coluna-lateral">
                            <section className="meu-perfil-card meu-perfil-card-identidade">
                                <div className="meu-perfil-avatar-area">
                                    <div className="meu-perfil-avatar">
                                        {previewFoto ||
                                            fotoUrl ? (
                                            <img
                                                src={
                                                    previewFoto ??
                                                    fotoUrl ??
                                                    ""
                                                }
                                                alt="Fotografia de perfil"
                                            />
                                        ) : (
                                            <span>
                                                {obterIniciais(
                                                    formulario.nome ||
                                                    utilizador?.nome,
                                                )}
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            className="meu-perfil-avatar-camera"
                                            title="Selecionar fotografia"
                                            aria-label="Selecionar fotografia"
                                            onClick={() =>
                                                inputFotoRef.current?.click()
                                            }
                                            disabled={
                                                salvandoFoto ||
                                                removendoFoto
                                            }
                                        >
                                            <Camera
                                                size={16}
                                            />
                                        </button>
                                    </div>

                                    <input
                                        ref={
                                            inputFotoRef
                                        }
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                        className="meu-perfil-input-foto"
                                        onChange={
                                            selecionarFoto
                                        }
                                    />
                                </div>

                                <h2>
                                    {formulario.nome ||
                                        utilizador?.nome ||
                                        "Utilizador"}
                                </h2>

                                <span className="meu-perfil-badge">
                                    {perfil?.perfil ||
                                        utilizador?.perfil ||
                                        "Utilizador"}
                                </span>

                                <div className="meu-perfil-email-resumo">
                                    <Mail
                                        size={15}
                                    />

                                    <span>
                                        {formulario.email ||
                                            utilizador?.email ||
                                            "—"}
                                    </span>
                                </div>

                                <div className="meu-perfil-foto-acoes">
                                    <button
                                        type="button"
                                        className="meu-perfil-btn-secundario"
                                        onClick={() =>
                                            inputFotoRef.current?.click()
                                        }
                                        disabled={
                                            salvandoFoto ||
                                            removendoFoto
                                        }
                                    >
                                        <Upload
                                            size={16}
                                        />

                                        {perfil?.temFotoPerfil
                                            ? "Alterar foto"
                                            : "Adicionar foto"}
                                    </button>

                                    {perfil?.temFotoPerfil &&
                                        !fotoSelecionada && (
                                            <button
                                                type="button"
                                                className="meu-perfil-btn-perigo"
                                                onClick={() =>
                                                    void removerFoto()
                                                }
                                                disabled={
                                                    removendoFoto ||
                                                    salvandoFoto
                                                }
                                            >
                                                {removendoFoto ? (
                                                    <Loader2
                                                        size={16}
                                                        className="meu-perfil-rotating"
                                                    />
                                                ) : (
                                                    <Trash2
                                                        size={16}
                                                    />
                                                )}

                                                Remover
                                            </button>
                                        )}
                                </div>

                                {fotoSelecionada && (
                                    <div className="meu-perfil-foto-selecionada">
                                        <div>
                                            <strong>
                                                {
                                                    fotoSelecionada.name
                                                }
                                            </strong>

                                            <span>
                                                {formatarTamanho(
                                                    fotoSelecionada.size,
                                                )}
                                            </span>
                                        </div>

                                        <div className="meu-perfil-foto-selecionada-acoes">
                                            <button
                                                type="button"
                                                className="meu-perfil-btn-secundario"
                                                onClick={
                                                    cancelarFotoSelecionada
                                                }
                                                disabled={
                                                    salvandoFoto
                                                }
                                            >
                                                Cancelar
                                            </button>

                                            <button
                                                type="button"
                                                className="meu-perfil-btn-primary"
                                                onClick={() =>
                                                    void guardarFoto()
                                                }
                                                disabled={
                                                    salvandoFoto
                                                }
                                            >
                                                {salvandoFoto ? (
                                                    <Loader2
                                                        size={16}
                                                        className="meu-perfil-rotating"
                                                    />
                                                ) : (
                                                    <Save
                                                        size={16}
                                                    />
                                                )}

                                                Guardar foto
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <p className="meu-perfil-foto-ajuda">
                                    JPG, PNG ou WebP. Máximo de 5 MB.
                                </p>

                                <div className="meu-perfil-identidade-detalhes">
                                    <div>
                                        <span>
                                            Estado
                                        </span>

                                        <strong className="meu-perfil-estado-ativo">
                                            Ativo
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Conta criada
                                        </span>

                                        <strong>
                                            {formatarData(
                                                perfil?.dataCriacao,
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            ID do utilizador
                                        </span>

                                        <strong>
                                            #
                                            {perfil?.idUtilizador ??
                                                utilizador?.idUtilizador ??
                                                "—"}
                                        </strong>
                                    </div>
                                </div>
                            </section>
                        </aside>

                        {/* =====================================
                            COLUNA DIREITA
                            ===================================== */}

                        <div className="meu-perfil-coluna-principal">
                            {/* =================================
                                DADOS PESSOAIS
                                ================================= */}

                            <section className="meu-perfil-card">
                                <div className="meu-perfil-card-header">
                                    <div className="meu-perfil-card-icon">
                                        <UserRound
                                            size={20}
                                        />
                                    </div>

                                    <div>
                                        <h2>
                                            Dados pessoais
                                        </h2>

                                        <p>
                                            Atualize o nome e o email
                                            associados à sua conta.
                                        </p>
                                    </div>
                                </div>

                                <form
                                    className="meu-perfil-form"
                                    onSubmit={
                                        guardarPerfil
                                    }
                                >
                                    <label>
                                        Nome

                                        <div className="meu-perfil-input-com-icone">
                                            <UserRound
                                                size={17}
                                            />

                                            <input
                                                type="text"
                                                value={
                                                    formulario.nome
                                                }
                                                onChange={(
                                                    evento,
                                                ) =>
                                                    atualizarCampoPerfil(
                                                        "nome",
                                                        evento.target.value,
                                                    )
                                                }
                                                maxLength={
                                                    150
                                                }
                                                autoComplete="name"
                                                required
                                            />
                                        </div>
                                    </label>

                                    <label>
                                        Email

                                        <div className="meu-perfil-input-com-icone">
                                            <Mail
                                                size={17}
                                            />

                                            <input
                                                type="email"
                                                value={
                                                    formulario.email
                                                }
                                                onChange={(
                                                    evento,
                                                ) =>
                                                    atualizarCampoPerfil(
                                                        "email",
                                                        evento.target.value,
                                                    )
                                                }
                                                maxLength={
                                                    150
                                                }
                                                autoComplete="email"
                                                required
                                            />
                                        </div>
                                    </label>

                                    <label>
                                        Perfil de acesso

                                        <div className="meu-perfil-input-com-icone meu-perfil-input-bloqueado">
                                            <ShieldCheck
                                                size={17}
                                            />

                                            <input
                                                type="text"
                                                value={
                                                    perfil?.perfil ??
                                                    utilizador?.perfil ??
                                                    ""
                                                }
                                                readOnly
                                            />
                                        </div>

                                        <small>
                                            O perfil de acesso só pode
                                            ser alterado por um
                                            administrador.
                                        </small>
                                    </label>

                                    <div className="meu-perfil-form-footer">
                                        <button
                                            type="submit"
                                            className="meu-perfil-btn-primary"
                                            disabled={
                                                salvandoPerfil
                                            }
                                        >
                                            {salvandoPerfil ? (
                                                <Loader2
                                                    size={17}
                                                    className="meu-perfil-rotating"
                                                />
                                            ) : (
                                                <Save
                                                    size={17}
                                                />
                                            )}

                                            {salvandoPerfil
                                                ? "A guardar..."
                                                : "Guardar alterações"}
                                        </button>
                                    </div>
                                </form>
                            </section>

                            {/* =================================
                                SEGURANÇA
                                ================================= */}

                            <section className="meu-perfil-card">
                                <div className="meu-perfil-card-header">
                                    <div className="meu-perfil-card-icon">
                                        <LockKeyhole
                                            size={20}
                                        />
                                    </div>

                                    <div>
                                        <h2>
                                            Segurança
                                        </h2>

                                        <p>
                                            Altere a palavra-passe
                                            utilizada para entrar na
                                            plataforma.
                                        </p>
                                    </div>
                                </div>

                                <form
                                    className="meu-perfil-form"
                                    onSubmit={
                                        guardarSenha
                                    }
                                >
                                    <label>
                                        Nova palavra-passe

                                        <div className="meu-perfil-input-com-icone">
                                            <KeyRound
                                                size={17}
                                            />

                                            <input
                                                type="password"
                                                value={
                                                    formularioSenha.novaPassword
                                                }
                                                onChange={(
                                                    evento,
                                                ) =>
                                                    setFormularioSenha(
                                                        (
                                                            anterior,
                                                        ) => ({
                                                            ...anterior,
                                                            novaPassword:
                                                                evento
                                                                    .target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                                minLength={
                                                    8
                                                }
                                                maxLength={
                                                    100
                                                }
                                                autoComplete="new-password"
                                                required
                                            />
                                        </div>

                                        <small>
                                            Utilize pelo menos 8
                                            caracteres.
                                        </small>
                                    </label>

                                    <label>
                                        Confirmar nova palavra-passe

                                        <div className="meu-perfil-input-com-icone">
                                            <KeyRound
                                                size={17}
                                            />

                                            <input
                                                type="password"
                                                value={
                                                    formularioSenha.confirmarPassword
                                                }
                                                onChange={(
                                                    evento,
                                                ) =>
                                                    setFormularioSenha(
                                                        (
                                                            anterior,
                                                        ) => ({
                                                            ...anterior,
                                                            confirmarPassword:
                                                                evento
                                                                    .target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                                minLength={
                                                    8
                                                }
                                                maxLength={
                                                    100
                                                }
                                                autoComplete="new-password"
                                                required
                                            />
                                        </div>
                                    </label>

                                    <div className="meu-perfil-seguranca-aviso">
                                        <ShieldCheck
                                            size={18}
                                        />

                                        <div>
                                            <strong>
                                                Segurança da conta
                                            </strong>

                                            <span>
                                                Escolha uma palavra-passe
                                                que não utilize noutros
                                                serviços.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="meu-perfil-form-footer">
                                        <button
                                            type="submit"
                                            className="meu-perfil-btn-primary"
                                            disabled={
                                                salvandoSenha
                                            }
                                        >
                                            {salvandoSenha ? (
                                                <Loader2
                                                    size={17}
                                                    className="meu-perfil-rotating"
                                                />
                                            ) : (
                                                <KeyRound
                                                    size={17}
                                                />
                                            )}

                                            {salvandoSenha
                                                ? "A alterar..."
                                                : "Alterar palavra-passe"}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}