import { execSync } from "child_process";

const OPENAPI_URL = "http://localhost:41050/openapi.json";
const OUTPUT_PATH = "./src/ui/api/generated-schemas.ts";

try {
    console.log(`Generating API schema from '${OPENAPI_URL}'...\n`);

    const output = execSync(
        `npx openapi-zod-client ${OPENAPI_URL} -o ${OUTPUT_PATH}`,
    ).toString();

    if (output.trim()) {
        console.log(output);
    }
    console.log("\nSchema generated successfully!");
} catch (error) {
    console.error(
        "\n\nFailed to generate API schema! Is the server running on the expected port?\n",
    );
    if (error instanceof Error) {
        console.error(error.message);
    }
    const err = error as { stderr?: Buffer };
    if (err.stderr) {
        console.error(err.stderr.toString());
    }
    process.exitCode = 1;
}
