import { Menu } from "../menu/Menu";
import { TopBar } from "../topbar/TopBar";

import "./Header.css";
import { NotificationBell } from "./notification-bell/NotificationBell";

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
