/**
 * File with global types definitions.
 */

type EventPayloadMapping = {
    data: string;
    getStaticData: string;
    userSettings: UserSettings,
    requestUserSettings: UserSettings,
    changeUserSettings: UserSettings
}

type UnsubscribeFunction = () => void;

interface Window {
  electron: {

    subscribeData: (
      callback: (data: string) => void
    ) => UnsubscribeFunction;

    getStaticData: () => Promise<string>;

    requestUserSettings: () => Promise<UserSettings>;

    onUserSettings: (
      callback: (data: UserSettings) => void
    ) => UnsubscribeFunction;
    
    changeUserSettings: (settings: UserSettings) => void;
  };
}

type Language = "en" | "de";

type UserSettings = {
  lang: Language;
}