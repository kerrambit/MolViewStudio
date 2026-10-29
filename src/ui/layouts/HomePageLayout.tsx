/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Outlet } from "react-router-dom";
import { Footer } from "../components/common/footer/Footer";
import { Header } from "./components/Header";
import { ServerStatus } from "../features/processing/processing-server-health/components/ServerStatus";
import { HomePageMenuBridge } from "../features/home-page/menu/HomePageMenuBridge";

import "./Layout.css";

export function HomePageLayout() {
    return (
        <HomePageMenuBridge>
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
        </HomePageMenuBridge>
    );
}

export default HomePageLayout;
