import { Outlet } from "react-router-dom";
import { Footer } from "../components/common/footer/Footer";
import { Header } from "./header/Header";
import { AppMenuBridge } from "../providers/AppMenuBridge";
import { ServerStatus } from "../features/system/components/server-status/ServerStatus";

import "./MainLayout.css";

export function MainLayout() {
    return (
        <AppMenuBridge>
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
        </AppMenuBridge>
    );
}

export default MainLayout;
