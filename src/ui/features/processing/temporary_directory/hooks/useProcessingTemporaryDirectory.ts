/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useCallback } from "react";
import { useEnvironment } from "../../../environment/hooks/useEnvironment";

export function useProcessingTemporaryDirectory() {
    // Use environment.
    const env = useEnvironment();

    const getProcessingTemporaryDirectory = useCallback(() => {
        return `${env.userDataPath}/Processing`;
    }, [env]);

    return { getProcessingTemporaryDirectory };
}
