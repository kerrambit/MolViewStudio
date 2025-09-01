import { app } from "electron";
import { appendFileSync } from "fs";
import path from "path";

export function log(message: string) {
    try {
        const logFile = path.join(app.getPath("userData"), "app.log");
        appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
    } catch {}
}
