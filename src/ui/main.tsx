import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import routes from "./router/routes.tsx";
import { UserSettingsProvider } from "./services/UserSettingsProvider.tsx";
import { AppearanceProvider } from "./services/AppearanceProvider.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegimeProvider } from "./services/RegimeProvider.tsx";
import { DialogueProvider } from "./services/DialogueProvider.tsx";
import { ManagedAssetsProvider } from "./services/ManagedAssetsProvider.tsx";
import { ProcessingProvider } from "./services/ProcessingProvider.tsx";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";

const router = createMemoryRouter(routes);
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <UserSettingsProvider>
            <AppearanceProvider>
                <RegimeProvider>
                    <ProcessingProvider>
                        <DialogueProvider>
                            <ManagedAssetsProvider>
                                <RouterProvider router={router} />
                            </ManagedAssetsProvider>
                        </DialogueProvider>
                    </ProcessingProvider>
                </RegimeProvider>
            </AppearanceProvider>
        </UserSettingsProvider>
    </QueryClientProvider>,
);
