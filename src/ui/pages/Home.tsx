import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Home() {
    const { t } = useTranslation();
    return (
        <div>
            <nav>
                <Link to="/">{t("Home")}</Link> |{" "}
                <Link to="/settings">{t("Settings")}</Link> |{" "}
                <Link to="/viewer">{t("Viewer")}</Link> |{" "}
            </nav>
            <h1>{t("Home")}</h1>
        </div>
    );
}
