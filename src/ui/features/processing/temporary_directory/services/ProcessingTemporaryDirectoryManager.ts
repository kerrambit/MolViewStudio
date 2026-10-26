/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useEffect } from "react";
import { loggerUi } from "../../../../services/UiLoggingService";
import { useClearTemporaryDirectory } from "../api/useClearTemporaryDirectory";

let cleanupStarted = false;

export function ProcessingTemporaryDirectoryManager() {
    const { mutate } = useClearTemporaryDirectory();

    useEffect(() => {
        if (cleanupStarted) return;
        cleanupStarted = true;

        mutate(undefined, {
            onSuccess: (result) => {
                loggerUi.info(
                    `Processing cleanup: freed ${(result.bytes_freed / 1e6).toFixed(
                        1,
                    )} MB, ` + `${result.errors.length} errors`,
                );
            },
            onError: () => {},
        });
    }, [mutate]);

    return null;
}
