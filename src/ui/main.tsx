import { RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { router } from "./router/router.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserSettingsProvider } from "./providers/UserSettingsProvider.tsx";
import { AppearanceProvider } from "./providers/AppearanceProvider.tsx";
import { DialogueHost } from "./components/common/dialogue/DialogueHost.tsx";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <UserSettingsProvider>
            <AppearanceProvider>
                <RouterProvider router={router} />
                <DialogueHost />
            </AppearanceProvider>
        </UserSettingsProvider>
    </QueryClientProvider>,
);
