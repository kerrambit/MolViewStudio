import type { NotificationData } from "@mantine/notifications";
import { IconAlertTriangle } from "@tabler/icons-react";

const warningIcon = <IconAlertTriangle size={20} />;

export function WarningNotification(message: string): NotificationData {
    return {
        id: crypto.randomUUID(),
        title: "Warning",
        message: message,
        position: "top-right",
        withCloseButton: true,
        autoClose: 8000,
        color: "yellow",
        icon: warningIcon,
    };
}
