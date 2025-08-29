import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { UserSettingsContext } from "../services/UserSettingsProvider";
import { useContext } from "react";

export default function Settings() {

  const { t, i18n } = useTranslation();
  
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("Settings must be used within UserSettingsProvider");
  }
  const { settings, setSettings } = context;

  const changeLanguage = (newLang: Language) => {
      i18n.changeLanguage(newLang);
      setSettings({...settings, lang: newLang});
  };

  return (
    <div>
      <nav>
        <Link to="/">{t("Home")}</Link> | <Link to="/settings">{t("Settings")}</Link> | <Link to="/counter">{t("Counter")}</Link>
      </nav>
      <h1>{t("Settings")}</h1>
      <div>
        <button className={settings.lang === 'en' ? 'selected' : ''} onClick={() => changeLanguage('en')}>English</button>
        <button className={settings.lang === 'de' ? 'selected' : ''} onClick={() => changeLanguage('de')}>Deutsch</button>
      </div>
    </div>
  )
}