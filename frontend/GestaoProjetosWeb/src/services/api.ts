const API_URL = "/api";

const TOKEN_KEY = "gestaoProjetosToken";
const UTILIZADOR_KEY = "gestaoProjetosUtilizador";

/* =========================================================
   TOKEN
   ========================================================= */

function obterToken(): string | null {
    return (
        localStorage.getItem(TOKEN_KEY) ??
        sessionStorage.getItem(TOKEN_KEY)
    );
}

/* =========================================================
   LIMPAR SESSÃO
   ========================================================= */

function limparSessao(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(UTILIZADOR_KEY);

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(UTILIZADOR_KEY);
}

/* =========================================================
   OBTER MENSAGEM DE ERRO DA API
   ========================================================= */

async function obterMensagemErro(
    response: Response,
): Promise<string> {
    let mensagem =
        "Não foi possível concluir a operação.";

    try {
        const data = await response.json();

        if (
            data &&
            typeof data === "object" &&
            "mensagem" in data &&
            typeof data.mensagem === "string"
        ) {
            mensagem = data.mensagem;
        }
    } catch {
        // A resposta não contém JSON.
    }

    return mensagem;
}

/* =========================================================
   VERIFICAR 401
   ========================================================= */

function tratarNaoAutorizado(
    response: Response,
): void {
    if (response.status === 401) {
        limparSessao();
    }
}

/* =========================================================
   API REQUEST
   JSON
   ========================================================= */

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const token = obterToken();

    const headers =
        new Headers(options.headers);

    /*
     * Só definimos application/json quando existe um body
     * e o body NÃO é FormData.
     */
    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set(
            "Content-Type",
            "application/json",
        );
    }

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`,
        );
    }

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers,
            },
        );

    tratarNaoAutorizado(response);

    if (!response.ok) {
        const mensagem =
            await obterMensagemErro(
                response,
            );

        throw new Error(mensagem);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType =
        response.headers.get(
            "content-type",
        );

    if (
        !contentType ||
        !contentType.includes(
            "application/json",
        )
    ) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

/* =========================================================
   API FORM DATA
   Upload de ficheiros
   ========================================================= */

export async function apiFormData<T>(
    endpoint: string,
    formData: FormData,
    options: Omit<
        RequestInit,
        "body"
    > = {},
): Promise<T> {
    const token = obterToken();

    const headers =
        new Headers(options.headers);

    /*
     * Não definir manualmente multipart/form-data.
     * O navegador adiciona automaticamente o boundary.
     */
    headers.delete("Content-Type");

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`,
        );
    }

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,

                method:
                    options.method ??
                    "POST",

                headers,

                body: formData,
            },
        );

    tratarNaoAutorizado(response);

    if (!response.ok) {
        const mensagem =
            await obterMensagemErro(
                response,
            );

        throw new Error(mensagem);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType =
        response.headers.get(
            "content-type",
        );

    if (
        !contentType ||
        !contentType.includes(
            "application/json",
        )
    ) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

/* =========================================================
   API BLOB
   Visualização e download de ficheiros protegidos
   ========================================================= */

export async function apiBlob(
    endpoint: string,
    options: RequestInit = {},
): Promise<Blob> {
    const token = obterToken();

    const headers =
        new Headers(options.headers);

    headers.delete("Content-Type");

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`,
        );
    }

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers,
            },
        );

    tratarNaoAutorizado(response);

    if (!response.ok) {
        const mensagem =
            await obterMensagemErro(
                response,
            );

        throw new Error(mensagem);
    }

    return response.blob();
}

/* =========================================================
   ABRIR FICHEIRO PROTEGIDO
   ========================================================= */

export async function abrirArquivoProtegido(
    endpoint: string,
): Promise<void> {
    const blob =
        await apiBlob(endpoint);

    const url =
        URL.createObjectURL(blob);

    const novaJanela =
        window.open(
            url,
            "_blank",
            "noopener,noreferrer",
        );

    window.setTimeout(
        () => {
            URL.revokeObjectURL(url);
        },
        60_000,
    );

    if (!novaJanela) {
        URL.revokeObjectURL(url);

        throw new Error(
            "O navegador bloqueou a abertura do documento. Autorize pop-ups para esta aplicação.",
        );
    }
}

/* =========================================================
   DOWNLOAD DE FICHEIRO PROTEGIDO
   ========================================================= */

export async function descarregarArquivoProtegido(
    endpoint: string,
    nomeArquivo: string,
): Promise<void> {
    const blob =
        await apiBlob(endpoint);

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        nomeArquivo.trim() ||
        "documento";

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.setTimeout(
        () => {
            URL.revokeObjectURL(url);
        },
        1_000,
    );
}

/* =========================================================
   EXPORTAÇÕES
   ========================================================= */

export {
    API_URL,
};