import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const executable =
    process.platform === "win32" ? "MolStarAppServer.exe" : "MolStarAppServer";

const serverPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../dist-server",
    executable
);

if (!existsSync(serverPath)) {
    console.error("Server binary not found! Run `npm run build:server` first.");
    process.exit(1);
}

spawn(serverPath, { stdio: "inherit" });
