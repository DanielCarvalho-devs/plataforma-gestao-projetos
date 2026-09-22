import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";

import GestaoProjetos from "./Projetos/GestaoProjetos";
import DetalheProjeto from "./Projetos/DetalheProjeto";

import Historico from "./Historico/Historico";
import Utilizadores from "./Utilizadores/Utilizadores";
import MeuPerfil from "./Perfil/MeuPerfil";

export default function App() {
    return (
        <Routes>
        <Route
                path= "/login"
    element = {< Login />}
            />

    < Route
path = "/"
element = {
                    < ProtectedRoute >
    <Dashboard />
    </ProtectedRoute>
                }
            />

    < Route
path = "/gestao-projetos"
element = {
                    < ProtectedRoute >
    <GestaoProjetos />
    </ProtectedRoute>
                }
            />

    < Route
path = "/projetos/:id"
element = {
                    < ProtectedRoute >
    <DetalheProjeto />
    </ProtectedRoute>
                }
            />

    < Route
path = "/historico"
element = {
                    < ProtectedRoute >
    <Historico />
    </ProtectedRoute>
                }
            />

    < Route
path = "/utilizadores"
element = {
                    < ProtectedRoute >
    <Utilizadores />
    </ProtectedRoute>
                }
            />

    < Route
path = "/meu-perfil"
element = {
                    < ProtectedRoute >
    <MeuPerfil />
    </ProtectedRoute>
                }
            />

    < Route
path = "*"
element = {
                    < Navigate
to = "/"
replace
    />
                }
            />
    </Routes>
    );
}