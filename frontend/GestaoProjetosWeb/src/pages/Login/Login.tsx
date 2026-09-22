import {
  Eye,
  EyeOff,
  FolderKanban,
  History,
  ShieldCheck,
  Users,
  Building2,
} from "lucide-react";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

import "./Login.css";

export default function Login() {
  const {
    login,
    autenticado,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  const [manterSessao, setManterSessao] =
    useState(false);

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    const emailGuardado =
      localStorage.getItem("gestaoProjetosEmail");

    if (emailGuardado) {
      setEmail(emailGuardado);
      setManterSessao(true);
    }
  }, []);

  if (autenticado) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      await login(
        email.trim(),
        password,
        manterSessao
      );

      if (manterSessao) {
        localStorage.setItem(
          "gestaoProjetosEmail",
          email.trim()
        );
      } else {
        localStorage.removeItem(
          "gestaoProjetosEmail"
        );
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar sessão."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-company-panel">
        <div className="company-panel-inner">
          <header className="company-brand">
            <div className="company-logo">
              <FolderKanban size={27} />
            </div>

            <div>
              <strong>
                Gestão de Projetos
              </strong>

              <span>
                Plataforma empresarial
              </span>
            </div>
          </header>

          <div className="company-hero">
            <span className="company-eyebrow">
              CONTROLO · ORGANIZAÇÃO · RESULTADOS
            </span>

            <h1>
              Uma gestão mais
              <br />
              simples e eficiente.
            </h1>

            <p>
              Centralize clientes, projetos, tarefas,
              documentos, alterações e histórico numa
              única plataforma profissional.
            </p>

            <div className="company-benefits">
              <article>
                <div>
                  <Building2 size={21} />
                </div>

                <strong>
                  Gestão centralizada
                </strong>

                <span>
                  Toda a informação operacional
                  organizada num só sistema.
                </span>
              </article>

              <article>
                <div>
                  <Users size={21} />
                </div>

                <strong>
                  Perfis e acessos
                </strong>

                <span>
                  Permissões adequadas a cada
                  utilizador da plataforma.
                </span>
              </article>

              <article>
                <div>
                  <History size={21} />
                </div>

                <strong>
                  Auditoria
                </strong>

                <span>
                  Histórico automático das
                  principais operações.
                </span>
              </article>
            </div>
          </div>

          <footer className="company-footer">
            <span>Gestão de Projetos</span>
            <span>© 2026</span>
          </footer>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-box">
          <div className="mobile-brand">
            <FolderKanban size={24} />
            <strong>
              Gestão de Projetos
            </strong>
          </div>

          <div className="login-heading">
            <div className="reserved-area">
              <ShieldCheck size={17} />
              Área reservada
            </div>

            <h2>
              Bem-vindo
            </h2>

            <p>
              Introduza as suas credenciais para
              aceder à plataforma.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            {erro && (
              <div className="login-error">
                {erro}
              </div>
            )}

            <div className="form-field">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="nome@empresa.pt"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">
                Palavra-passe
              </label>

              <div className="password-field">
                <input
                  id="password"
                  type={
                    mostrarPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Introduza a sua palavra-passe"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword(
                      (valor) => !valor
                    )
                  }
                  aria-label={
                    mostrarPassword
                      ? "Ocultar palavra-passe"
                      : "Mostrar palavra-passe"
                  }
                >
                  {mostrarPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <label className="remember-session">
              <input
                type="checkbox"
                checked={manterSessao}
                onChange={(event) =>
                  setManterSessao(
                    event.target.checked
                  )
                }
              />

              <span>
                Manter sessão iniciada
              </span>
            </label>

            <button
              className="login-submit"
              type="submit"
              disabled={carregando}
            >
              {carregando
                ? "A autenticar..."
                : "Entrar na plataforma"}
            </button>
          </form>

          <div className="login-security">
            <ShieldCheck size={16} />

            <span>
              Ligação protegida e acesso autenticado
            </span>
          </div>

          <div className="login-help">
            Para assistência de acesso,
            contacte o administrador do sistema.
          </div>
        </div>
      </section>
    </main>
  );
}
