import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import routes from "./router/routes.tsx";
import { UserSettingsProvider } from "./providers/UserSettingsProvider.tsx";
import { AppearanceProvider } from "./providers/AppearanceProvider.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";
import { DialogueHost } from "./components/common/dialogue/DialogueHost.tsx";

const router = createMemoryRouter(routes);
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
