import { Avatar } from "./avatar/Avatar";
import { Menu } from "./menu/Menu";
import { NotificationBell } from "./notification-bell/NotificationBell";
import { TopBar } from "../common/topbar/TopBar";

import "./Header.css";

export function Header() {
    return (
        <TopBar>
            <Menu></Menu>
            <div className="header__right-side">
                <NotificationBell></NotificationBell>
                <Avatar></Avatar>
            </div>
        </TopBar>
    );
}
