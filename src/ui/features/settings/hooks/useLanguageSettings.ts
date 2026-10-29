/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useTranslation } from "react-i18next";
import { useUserSettingsStore } from "../stores/userSettingsStore";

export function useLanguageSettings() {
    // Use translation.
    const { i18n } = useTranslation();

    // Use user settings.
    const settings = useUserSettingsStore((state) => state.settings);
    const setSettings = useUserSettingsStore((state) => state.setSettings);

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
