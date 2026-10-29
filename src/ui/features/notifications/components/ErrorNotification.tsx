/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

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
