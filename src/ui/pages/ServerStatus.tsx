import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useServerStatus } from "../hooks/useServerStatus";

export default function ServerStatus() {
    const { t } = useTranslation();
    const { isLoading, error } = useServerStatus();

    if (isLoading) {
        return (
            <div>
                <div>
                    <nav>
                        <Link to="/">{t("Home")}</Link> |{" "}
                        <Link to="/settings">{t("Settings")}</Link> |{" "}
                        <Link to="/counter">{t("Counter")}</Link> |{" "}
                        <Link to="/server-status">Server status</Link> |{" "}
                    </nav>
                </div>
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div>
                    <nav>
                        <Link to="/">{t("Home")}</Link> |{" "}
                        <Link to="/settings">{t("Settings")}</Link> |{" "}
                        <Link to="/counter">{t("Counter")}</Link> |{" "}
                        <Link to="/server-status">Server status</Link> |{" "}
                    </nav>
                </div>
                Server offline
            </div>
        );
    }

    return (
        <div>
            <div>
                <nav>
                    <Link to="/">{t("Home")}</Link> |{" "}
                    <Link to="/settings">{t("Settings")}</Link> |{" "}
                    <Link to="/counter">{t("Counter")}</Link> |{" "}
                    <Link to="/server-status">Server status</Link> |{" "}
                </nav>
            </div>
            Server online
        </div>
    );
}
