/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import log from "electron-log";

log.transports.console.level = false;

export const logger = {
    initialize: () => log.initialize(),
    info: (...args: any[]) => log.info(...args),
    error: (...args: any[]) => log.error(...args),
    warn: (...args: any[]) => log.warn(...args),
    debug: (...args: any[]) => log.debug(...args),
};
