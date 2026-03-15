import { Indicator } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import { useAppearance } from "../../../services/AppearanceProvider";

import "./NotificationBell.css";

export function NotificationBell() {
    const { colorTheme } = useAppearance();
    const unreadNotifications = 5;
    const anyUnreadNotifications = unreadNotifications > 0;

    return (
        <div
            title={`You have ${unreadNotifications} unread notifications.`}
            className="notificationBell"
        >
            <Indicator
                position="bottom-end"
                withBorder
                processing
                size={12}
                offset={7}
                color={colorTheme.primaryColor}
                disabled={!anyUnreadNotifications}
            >
                <IconBell size={28} />
            </Indicator>
        </div>
    );
}
