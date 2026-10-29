/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { router } from "./router/router.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppearanceProvider } from "./features/apperance/providers/AppearanceProvider.tsx";
import { ProcessingJobSocketsManager } from "./features/processing/job-sockets/services/ProcessingJobSocketsManager.tsx";
import { DialogueManager } from "./features/dialogue/services/DialogueManager.tsx";
import { FileMappingsManager } from "./features/workspace/services/FileMappingsManager.ts";
import { ProcessingTemporaryDirectoryManager } from "./features/processing/temporary_directory/services/ProcessingTemporaryDirectoryManager.ts";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <AppearanceProvider>
            <RouterProvider router={router} />
            <ProcessingJobSocketsManager />
            <ProcessingTemporaryDirectoryManager />
            <FileMappingsManager />
            <DialogueManager />
        </AppearanceProvider>
    </QueryClientProvider>,
);
