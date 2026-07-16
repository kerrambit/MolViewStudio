import { Outlet } from "react-router-dom";
import { Footer } from "../components/common/footer/Footer";
import { Header } from "./header/Header";
import { ViewerPageBridge } from "./menu-bridges/ViewerPageBridge";
import { ServerStatus } from "../features/system/components/server-status/ServerStatus";

import "./Layout.css";

export function ViewerPageLayout() {
    return (
        <ViewerPageBridge>
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
        </ViewerPageBridge>
    );
}

export default ViewerPageLayout;
