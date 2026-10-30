/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState, useEffect } from "react";
import { WarningMessage } from "../../../../components/common/messages/WarningMessage";

export type FileOverrideWarningMessageProps = {
    outputPath: string;
    filename: string;
};

export function FileOverrideWarningMessage({
    outputPath,
    filename,
}: FileOverrideWarningMessageProps) {
    const [status, setStatus] = useState<"clear" | "exists" | "error">("clear");

    useEffect(() => {
        let isMounted = true;

        const checkFile = async () => {
            const fullPath = `${outputPath}/${filename.trim()}.mvsx`;

            try {
                const result = await window.electron.checkFilesExist([fullPath]);

                if (!isMounted) return;

                if (result instanceof Error) {
                    setStatus("error");
                } else if (Array.isArray(result) && result.some((exists) => exists)) {
                    setStatus("exists");
                } else {
                    setStatus("clear");
                }
            } catch (error) {
                if (isMounted) setStatus("error");
            }
        };

        const debounce = setTimeout(() => {
            checkFile();
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(debounce);
        };
    }, [outputPath, filename]);

    if (status === "clear") {
        return null;
    }

    const warningText =
        status === "exists"
            ? `A file named "${filename.trim()}.mvsx" already exists in the output folder. Continuing will overwrite it.`
            : `A file named "${filename.trim()}.mvsx" might already exist in the output folder. Continuing may overwrite it.`;

    return (
        <div style={{ display: "flex", justifyContent: "center" }}>
            <WarningMessage
                text={warningText}
                style={{ maxWidth: "80%", marginTop: "1.5em" }}
            />
        </div>
    );
}
