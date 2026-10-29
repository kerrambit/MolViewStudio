/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { notifications, type NotificationData } from "@mantine/notifications";
import { ErrorNotification } from "../components/ErrorNotification";
import { InfoNotification } from "../components/InfoNotification";
import { SuccessNotification } from "../components/SuccessNotification";
import { WarningNotification } from "../components/WarningNotification";

export function pushNotification(notification: NotificationData) {
    notifications.show(notification);
}

export function pushErrorNotification(message: string) {
    pushNotification(ErrorNotification(message));
}

export function pushInfoNotification(message: string) {
    pushNotification(InfoNotification(message));
}

export function pushSuccessNotification(message: string) {
    pushNotification(SuccessNotification(message));
}

export function pushWarningNotification(message: string) {
    pushNotification(WarningNotification(message));
}
