import { Outlet } from "react-router-dom";
import { Footer } from "../components/footer/Footer";
import { Header } from "../components/header/Header";
import { MenuProvider } from "../providers/MenuProvider";

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
                    <Footer />
                </div>
            </div>
        </MenuProvider>
    );
}

export default MainLayout;
