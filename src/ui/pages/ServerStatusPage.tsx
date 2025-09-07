import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ServerStatus } from "../components/server-status/ServerStatus";

export default function ServerStatusPage() {
    const { t } = useTranslation();

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
            <div style={{ display: "flex", justifyContent: "center" }}>
                <ServerStatus></ServerStatus>
            </div>
        </div>
    );
}
