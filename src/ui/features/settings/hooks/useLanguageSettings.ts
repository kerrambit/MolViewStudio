import { useTranslation } from "react-i18next";
import { useUserSettings } from "../../../providers/UserSettingsProvider";

export function useLanguageSettings() {
    // Use translation.
    const { i18n } = useTranslation();

    // Use user settings.
    const { settings, setSettings } = useUserSettings();

    // Handler for changing the language.
    const changeLanguage = (newLang: "en" | "de") => {
        i18n.changeLanguage(newLang);
        setSettings({ ...settings, lang: newLang });
    };

    return {
        currentLanguage: settings.lang,
        changeLanguage,
    };
}
