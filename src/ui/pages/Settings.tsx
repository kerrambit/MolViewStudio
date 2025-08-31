import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useUserSettings } from "../services/UserSettingsProvider";
import { ThemeSelector } from "../components/settings/ThemeSelector";
import { Text } from "@mantine/core";
import { useTheme } from "../services/ThemeProvider";

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { themeType, theme } = useTheme();

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
            <div>
                <Text fw={500} mb="md">
                    Custom Theme Component
                </Text>
                <Text mb="sm">Current theme: {themeType}</Text>
            </div>
            <div>
                <button
                    color={theme.primaryColor}
                    className={settings.lang === "en" ? "selected" : ""}
                    onClick={() => changeLanguage("en")}
                >
                    English
                </button>
                <button
                    color={theme.primaryColor}
                    className={settings.lang === "de" ? "selected" : ""}
                    onClick={() => changeLanguage("de")}
                >
                    Deutsch
                </button>
            </div>
            <ThemeSelector></ThemeSelector>
        </div>
    );
}
