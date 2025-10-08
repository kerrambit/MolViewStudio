import { useTranslation } from "react-i18next";
import { Button } from "../../components/common/button/Button";
import { BaseSettings } from "./BaseSettings";
import { useUserSettings } from "../../services/UserSettingsProvider";

export function LanguageSettings() {
    const { t, i18n } = useTranslation();
    const { settings, setSettings } = useUserSettings();

    const changeLanguage = (newLang: Language) => {
        i18n.changeLanguage(newLang);
        setSettings({ ...settings, lang: newLang });
    };

    return (
        <BaseSettings>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                }}
            >
                <label style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    Select the language:
                </label>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "1rem",
                    }}
                >
                    <Button
                        label={t("English")}
                        tooltip={t("Choose language English.")}
                        ariaLabel={t("Choose language English.")}
                        disabled={false}
                        variant={
                            settings.lang === "en" ? "primary" : "secondary"
                        }
                        size="medium"
                        onClick={() => changeLanguage("en")}
                    ></Button>
                    <Button
                        label={t("German")}
                        tooltip={t("Choose language German.")}
                        ariaLabel={t("Choose language German.")}
                        disabled={false}
                        variant={
                            settings.lang === "de" ? "primary" : "secondary"
                        }
                        size="medium"
                        onClick={() => changeLanguage("de")}
                    ></Button>
                </div>
            </div>
        </BaseSettings>
    );
}
