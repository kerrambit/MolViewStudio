import { app } from 'electron'
import path from 'path'
import { isDev } from './utils/util.js'

export function getPreloadPath(): string {
    return path.join(app.getAppPath(), isDev() ? ".": "..", "/dist-electron/preload.cjs");
}

export function getUiPath(): string {
    return path.join(app.getAppPath(), "dist-react/index.html");
}

export function getAssetsPath() {
  return path.join(app.getAppPath(), isDev() ? '.' : '..', '/src/assets');
}

export function getTranslationsPath() {
  return path.join(app.getAppPath(), isDev() ? '.' : '..', '/src/locales');
}