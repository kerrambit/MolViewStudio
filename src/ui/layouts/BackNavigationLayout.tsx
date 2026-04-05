import { Outlet, useNavigate } from "react-router-dom";
import { TopBar } from "../components/common/topbar/TopBar";
import { MenuProvider } from "../services/MenuProvider";

import "./BackNavigationLayout.css";

export function BackNavigationLayout() {
    const navigate = useNavigate();

    return (
        <MenuProvider>
            <div className="layout">
                <div className="layout__header">
                    <TopBar>
                        <span
                            className="layout__back-link"
                            onClick={() => navigate(-1)}
                            title="Go to the previous page."
                        >
                            Go back
                        </span>
                    </TopBar>
                </div>
                <div className="layout__content">
                    <Outlet />
                </div>
            </div>
        </MenuProvider>
    );
}
