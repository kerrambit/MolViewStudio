/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useTranslation } from "react-i18next";
import { useUserSettings } from "../../../hooks/useUserSettings";

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
