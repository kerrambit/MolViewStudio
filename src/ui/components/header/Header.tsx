import { Avatar } from "./avatar/Avatar";
import { Menu } from "./menu/Menu";
import { NotificationBell } from "./notification-bell/NotificationBell";

import "./Header.css";

export function Header() {
    return (
        <header className="header">
            <Menu></Menu>
            <div className="header__right-side">
                <NotificationBell></NotificationBell>
                <Avatar></Avatar>
            </div>
        </header>
    );
}
