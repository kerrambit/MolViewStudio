import log from "electron-log/renderer";

log.transports.console.level = false;

/* eslint-disable @typescript-eslint/no-explicit-any */
export const loggerUi = {
    info: (...args: any[]) => log.info(...args),
    error: (...args: any[]) => log.error(...args),
    warn: (...args: any[]) => log.warn(...args),
    debug: (...args: any[]) => log.debug(...args),
    /**
     * Methods to use when logging API operations.
     */
    api: {
        request: (
            endpoint: string,
            method: string,
            args?: Record<string, unknown>,
        ) => {
            loggerUi.info(`API Request: ${method} ${endpoint}`);

            if (args) {
                for (const [key, value] of Object.entries(args)) {
                    loggerUi.info(`  - ${key}: ${value}`);
                }
            }
        },
        successResponse: (endpoint: string, method: string) => {
            loggerUi.info(`API Response: ${method} ${endpoint} - Success`);
        },
        failureResponse: (
            endpoint: string,
            method: string,
            status: number,
            errorMessage: string,
        ) => {
            loggerUi.error(`API Response: ${method} ${endpoint} - Failure`);
            loggerUi.error(`  - Status: ${status}`);
            loggerUi.error(`  - Error: ${errorMessage}`);
        },
        networkError: (
            endpoint: string,
            method: string,
            errorMessage: string,
        ) => {
            loggerUi.error(
                `API Request: ${method} ${endpoint} - Network error`,
            );
            loggerUi.error(`  - Error: ${errorMessage}`);
        },
        unexpectedError: (endpoint: string, method: string, error: unknown) => {
            loggerUi.error(
                `API Request: ${method} ${endpoint} - Unexpected error`,
            );
            loggerUi.error(`  - Error: ${error}`);
        },
    },
};
