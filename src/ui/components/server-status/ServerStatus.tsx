import { useServerStatus } from "../../hooks/useServerStatus";
import { useTranslation } from "react-i18next";

import "./ServerStatus.css";

export function ServerStatus() {
    const { isLoading, error } = useServerStatus();
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div
                title={t("global.ServerStatus.Connecting...")}
                className="serverStatus"
            >
                <span className="serverStatus__label">
                    {t("global.ServerStatus.Server status")}:
                </span>
                <span className="dot dot--yellow"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div
                title={`${t(
                    "global.ServerStatus.Server has ended with an error"
                )}: <${error.message}>! ${t(
                    "global.ServerStatus.Go to Settings for more information."
                )}`}
                className="serverStatus"
            >
                <span className="serverStatus__label">
                    {t("global.ServerStatus.Server status")}:
                </span>
                <span className="dot dot--red"></span>
            </div>
        );
    }

    return (
        <div
            title={t("global.ServerStatus.Server is running.")}
            className="serverStatus"
        >
            <span className="serverStatus__label">
                {t("global.ServerStatus.Server status")}:
            </span>
            <span className="dot dot--green"></span>
        </div>
    );
}
