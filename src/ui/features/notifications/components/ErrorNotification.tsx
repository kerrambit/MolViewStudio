import type { NotificationData } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";

const xIcon = <IconX size={20} />;

export function ErrorNotification(message: string): NotificationData {
    return {
        id: crypto.randomUUID(),
        title: "Error",
        message: message,
        position: "top-right",
        withCloseButton: true,
        autoClose: false,
        color: "red",
        icon: xIcon,
    };
}
