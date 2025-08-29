import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n';

type UserSettingsContextType = {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
};

export const UserSettingsContext = createContext<UserSettingsContextType | null>(null);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>({ lang: "en" });
  const { i18n } = useTranslation();

   useEffect(() => {
    window.electron.changeUserSettings(settings);
  }, [settings]);

  useEffect(() => {
    const unsubscribe = window.electron.onUserSettings((newSettings: UserSettings) => {
      setSettings(newSettings);
      if (newSettings.lang && newSettings.lang !== i18n.language) {
        i18n.changeLanguage(newSettings.lang);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <UserSettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
}
