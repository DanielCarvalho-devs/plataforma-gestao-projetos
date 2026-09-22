import {
    FolderKanban,
} from "lucide-react";

import "./AppLoading.css";

export default function AppLoading() {
    return (
        <div className= "app-global-loading" >
        <div className="app-global-loading-glow app-global-loading-glow-one" />
            <div className="app-global-loading-glow app-global-loading-glow-two" />

                <div className="app-global-loading-content" >
                    <div className="app-global-loading-brand" >
                        <div className="app-global-loading-logo" >
                            <FolderKanban size={ 30 } strokeWidth = { 1.9} />
                                </div>

                                < div className = "app-global-loading-brand-text" >
                                    <strong>GESTÃO </strong>
                                    < span > Plataforma de Projetos </span>
                                        </div>
                                        </div>

                                        < div className = "app-global-loading-progress" >
                                            <div className="app-global-loading-progress-bar" />
                                                </div>

                                                < div className = "app-global-loading-status" >
                                                    <div className="app-global-loading-dots" >
                                                        <span />
                                                        < span />
                                                        <span />
                                                        </div>

                                                        <span>
                        A preparar o seu espaço de trabalho
        </span>
        </div>
        </div>

        < span className = "app-global-loading-footer" >
            Gestão de Projetos
                </span>
                </div>
    );
}
