import { Outlet } from "react-router-dom";

import "./MainLayout.css";
import { Footer } from "../components/footer/Footer";
import { Header } from "../components/header/Header";

export function MainLayout() {
    return (
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
    );
}

export default MainLayout;
