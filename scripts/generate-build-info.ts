import { execSync } from "child_process";
import fs from "fs";

const commit = (() => {
    try {
        return execSync("git rev-parse --short HEAD").toString().trim();
    } catch {
        return "unknown";
    }
})();

const volsegtoolsVersion = (() => {
    try {
        const content = fs.readFileSync(
            "./src/server/requirements.txt",
            "utf-8",
        );
        return content.match(/^volsegtools==(.+)$/m)?.[1].trim() ?? "unknown";
    } catch {
        return "unknown";
    }
})();

const molstarVersion = (() => {
    try {
        return JSON.parse(
            fs.readFileSync("./node_modules/molstar/package.json", "utf-8"),
        ).version;
    } catch {
        return "unknown";
    }
})();

const content = `// Auto-generated — do not edit.
export const BUILD_INFO = {
    commit: ${JSON.stringify(commit)},
    buildDate: ${JSON.stringify(new Date().toISOString().split("T")[0])},
    molstarVersion: ${JSON.stringify(molstarVersion)},
    volsegtoolsVersion: ${JSON.stringify(volsegtoolsVersion)},
} as const;
`;

fs.writeFileSync("./src/electron/build-info.ts", content);
console.log("Build info generated:", {
    commit,
    molstarVersion,
    volsegtoolsVersion,
});
