/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { router } from "./router/router.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppearanceProvider } from "./providers/AppearanceProvider.tsx";
import { DialogueHost } from "./components/common/dialogue/DialogueHost.tsx";
import { ProcessingJobSocketsManager } from "./features/processing/job-sockets/services/ProcessingJobSocketsManager.tsx";
import { FileMappingsLoader } from "./features/workspace/services/FileMappingsLoader.tsx";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <AppearanceProvider>
            <RouterProvider router={router} />
            <ProcessingJobSocketsManager />
            <FileMappingsLoader />
            <DialogueHost />
        </AppearanceProvider>
    </QueryClientProvider>,
);
