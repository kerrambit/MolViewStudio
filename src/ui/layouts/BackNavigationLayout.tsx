/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Outlet } from "react-router-dom";
import { router } from "../router/router";
import { TopBar } from "../components/common/topbar/TopBar";
import { MenuProvider } from "../providers/MenuProvider";

import "./BackNavigationLayout.css";

export function BackNavigationLayout() {
    return (
        <MenuProvider initialMenu={[]}>
            <div className="layout">
                <div className="layout__header">
                    <TopBar>
                        <span
                            className="layout__back-link"
                            onClick={() => router.navigate(-1)}
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
