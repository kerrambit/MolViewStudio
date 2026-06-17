import { Outlet } from "react-router-dom";
import { Footer } from "../common/footer/Footer";
import { Header } from "./header/Header";
import { MenuProvider } from "../../providers/MenuProvider";
import { ServerStatus } from "../server-status/ServerStatus";

import "./MainLayout.css";

export function MainLayout() {
    return (
        <MenuProvider>
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
        </MenuProvider>
    );
}

export default MainLayout;
