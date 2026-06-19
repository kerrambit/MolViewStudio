import { useTranslation } from "react-i18next";
import { Text } from "@mantine/core";
import { useServerStatus } from "../../../../api/hooks/useServerStatus";

import "./ServerStatus.css";

export function ServerStatus() {
    // Use server status.
    const { isLoading, error } = useServerStatus();

    // Use translation.
    const { t } = useTranslation();

    // Render the component.
    if (isLoading) {
        return (
            <div
                title={t("global.ServerStatus.Connecting...")}
                className="serverStatus"
            >
                <Text> {t("global.ServerStatus.Server status")}:</Text>
                <span className="dot dot--yellow"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div
                title={`${t(
                    "global.ServerStatus.Server has ended with an error",
                )}: <${error.message}>! ${t(
                    "global.ServerStatus.Go to Settings for more information.",
                )}`}
                className="serverStatus"
            >
                <Text> {t("global.ServerStatus.Server status")}:</Text>
                <span className="dot dot--red"></span>
            </div>
        );
    }

    return (
        <div
            title={t("global.ServerStatus.Server is running.")}
            className="serverStatus"
        >
            <Text> {t("global.ServerStatus.Server status")}:</Text>
            <span className="dot dot--green"></span>
        </div>
    );
}
