import { Menu } from "./menu/Menu";
import { NotificationBell } from "./notification-bell/NotificationBell";
import { TopBar } from "../../components/common/topbar/TopBar";

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
