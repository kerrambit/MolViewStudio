import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useUserSettings } from "../services/UserSettingsProvider";
import { ThemeSelector } from "../components/settings/ThemeSelector";
import { Button } from "../components/common/button/Button";
import { SchemeSelector } from "../components/settings/SchemeSelector";

export default function Settings() {
    const { t, i18n } = useTranslation();

    const { settings, setSettings } = useUserSettings();

    const changeLanguage = (newLang: Language) => {
        i18n.changeLanguage(newLang);
        setSettings({ ...settings, lang: newLang });
    };

    return (
        <div>
            <nav>
                <Link to="/">{t("Home")}</Link> |{" "}
                <Link to="/settings">{t("Settings")}</Link> |{" "}
                <Link to="/counter">{t("Counter")}</Link> |{" "}
                <Link to="/server-status">Server status</Link> |{" "}
            </nav>
            <h1>{t("Settings")}</h1>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    verticalAlign: "center",
                    gap: ".5rem",
                }}
            >
                <Button
                    label={t("English")}
                    tooltip={t("Choose language English.")}
                    ariaLabel={t("Choose language English.")}
                    disabled={false}
                    variant={"secondary"}
                    size="medium"
                    onClick={() => changeLanguage("en")}
                ></Button>
                <Button
                    label={t("German")}
                    tooltip={t("Choose language German.")}
                    ariaLabel={t("Choose language German.")}
                    disabled={false}
                    variant={"secondary"}
                    size="medium"
                    onClick={() => changeLanguage("de")}
                ></Button>
            </div>
            <div>
                <ThemeSelector></ThemeSelector>
                <SchemeSelector></SchemeSelector>
            </div>
        </div>
    );
}
