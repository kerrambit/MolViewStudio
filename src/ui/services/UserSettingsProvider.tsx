import React, { createContext, useState, useEffect, type ReactNode, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n';

type UserSettingsContextType = {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings | null>>;
};

export const UserSettingsContext = createContext<UserSettingsContextType | null>(null);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const didMount = useRef(false);
  const { i18n } = useTranslation();

   useEffect(() => {
      if (!didMount.current) {
        didMount.current = true;
        return;
      }
      if (settings) {
        window.electron.changeUserSettings(settings);
      }
    }, [settings]);

  useEffect(() => {
  window.electron.requestUserSettings().then((newSettings: UserSettings) => {
    setSettings(newSettings);
    if (newSettings.lang && newSettings.lang !== i18n.language) {
      i18n.changeLanguage(newSettings.lang);
    }
  });
}, []);

if (!settings) {
    return <div>Loading...</div>;
  }


  return (
    <UserSettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
}
