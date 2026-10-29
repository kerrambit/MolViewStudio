/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

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
