/**
 * Definition of Electron to IPC Renderer API.
 * See https://www.electronjs.org/docs/latest/tutorial/context-isolation.
 */

const electron = require('electron');

/**
 * Using IPC adapters for UI side.
 */
export class Ipc {
  static Ui = class {
    static invoke<Key extends keyof EventPayloadMapping>(key: Key): Promise<EventPayloadMapping[Key]> {
        return electron.ipcRenderer.invoke(key);
    }
    static on<Key extends keyof EventPayloadMapping>(key: Key, callback: (payload: EventPayloadMapping[Key]) => void) {
        const _callback = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
        electron.ipcRenderer.on(key, _callback);
        return () => electron.ipcRenderer.off(key, _callback);
    }
    static send<Key extends keyof EventPayloadMapping>(key: Key, payload: EventPayloadMapping[Key]) {
        electron.ipcRenderer.send(key, payload);
    }
  }
}

/**
 * API for communication between UI and Electron.
 * These methods can be used in the UI (React) components.
 */
electron.contextBridge.exposeInMainWorld('electron', {
  
  subscribeData: (callback: (data: string) => void) => {
    return Ipc.Ui.on("data", (payload: string) => {
      callback(payload);
    });
  },

  getStaticData: () => Ipc.Ui.invoke('getStaticData'),

  requestUserSettings: () => Ipc.Ui.invoke("requestUserSettings"),

  onUserSettings: (callback: (data: UserSettings) => void) => {
    return Ipc.Ui.on("userSettings", (payload: UserSettings) => {
      callback(payload);
    });
  },

  changeUserSettings: (settings: UserSettings) => {
    return Ipc.Ui.send("changeUserSettings", settings);
  },

} satisfies Window["electron"] );