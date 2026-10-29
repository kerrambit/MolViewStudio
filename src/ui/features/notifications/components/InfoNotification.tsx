/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { NotificationData } from "@mantine/notifications";
import { IconInfoCircle } from "@tabler/icons-react";

const infoIcon = <IconInfoCircle size={20} />;

export function InfoNotification(message: string): NotificationData {
    return {
        id: crypto.randomUUID(),
        title: "Info",
        message: message,
        position: "top-right",
        withCloseButton: true,
        autoClose: false,
        color: "blue",
        icon: infoIcon,
    };
}
