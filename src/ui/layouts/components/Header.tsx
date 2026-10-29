/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Menu } from "../../features/menu/components/Menu";
import { TopBar } from "../../components/common/topbar/TopBar";
import { NotificationBell } from "../../components/common/notification-bell/NotificationBell";

import "./Header.css";

export function Header() {
    return (
        <TopBar>
            <Menu></Menu>
            <div className="header__right-side">
                <NotificationBell></NotificationBell>
            </div>
        </TopBar>
    );
}
