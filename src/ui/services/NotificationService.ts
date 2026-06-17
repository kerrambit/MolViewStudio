import { notifications, type NotificationData } from "@mantine/notifications";
import { ErrorNotification } from "../features/notifications/components/ErrorNotification";
import { InfoNotification } from "../features/notifications/components/InfoNotification";
import { SuccessNotification } from "../features/notifications/components/SuccessNotification";
import { WarningNotification } from "../features/notifications/components/WarningNotification";

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
