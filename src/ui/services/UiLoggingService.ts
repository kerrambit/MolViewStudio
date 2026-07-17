import log from "electron-log/renderer";

log.transports.console.level = false;

/* eslint-disable @typescript-eslint/no-explicit-any */
export const loggerUi = {
    info: (...args: any[]) => log.info(...args),
    error: (...args: any[]) => log.error(...args),
    warn: (...args: any[]) => log.warn(...args),
    debug: (...args: any[]) => log.debug(...args),
};
