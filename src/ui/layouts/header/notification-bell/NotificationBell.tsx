import { Indicator } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";

import "./NotificationBell.css";

export function NotificationBell() {
    const unreadNotifications = 0; // TODO: until https://github.com/kerrambit/MolStarApp/issues/98 is solved
    const anyUnreadNotifications = unreadNotifications > 0;

    return (
        <div
            title={`You have ${unreadNotifications === 0 ? "no" : unreadNotifications} unread notifications.`}
            className="notificationBell"
        >
            <Indicator
                position="bottom-end"
                withBorder
                processing
                size={12}
                offset={7}
                color="yellow"
                disabled={!anyUnreadNotifications}
                styles={{
                    root: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    },
                }}
            >
                <IconBell size={28} />
            </Indicator>
        </div>
    );
}
