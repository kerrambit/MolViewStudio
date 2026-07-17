import { Outlet } from "react-router-dom";
import { Footer } from "../components/common/footer/Footer";
import { Header } from "../components/common/header/Header";
import { MainMenuBridge } from "./menu-bridges/MainMenuBridge";
import { ServerStatus } from "../features/system/components/server-status/ServerStatus";

import "./Layout.css";

export function MainLayout() {
    return (
        <MainMenuBridge>
            <div className={"layout"}>
                <div className="layout__header">
                    <Header />
                </div>
                <div className="layout__content">
                    <Outlet />
                </div>
                <div className="layout__footer">
                    <Footer>
                        <ServerStatus />
                    </Footer>
                </div>
            </div>
        </MainMenuBridge>
    );
}

export default MainLayout;
