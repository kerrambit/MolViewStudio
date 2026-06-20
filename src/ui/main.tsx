import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import routes from "./router/routes.tsx";
import { UserSettingsProvider } from "./providers/UserSettingsProvider.tsx";
import { AppearanceProvider } from "./providers/AppearanceProvider.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegimeProvider } from "./providers/RegimeProvider.tsx";
import { DialogueProvider } from "./providers/DialogueProvider.tsx";
import { ManagedAssetsProvider } from "./providers/ManagedAssetsProvider.tsx";
import { ProcessingProvider } from "./providers/ProcessingProvider.tsx";
import { RecentFilesProvider } from "./providers/RecentFilesProvider.tsx";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";

const router = createMemoryRouter(routes);
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <UserSettingsProvider>
            <RecentFilesProvider>
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
            </RecentFilesProvider>
        </UserSettingsProvider>
    </QueryClientProvider>,
);
