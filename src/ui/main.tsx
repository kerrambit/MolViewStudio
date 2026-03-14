import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import routes from "./router/routes.tsx";
import { UserSettingsProvider } from "./services/UserSettingsProvider.tsx";
import { ThemeProvider } from "./services/ThemeProvider.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegimeProvider } from "./services/RegimeProvider.tsx";
import { MenuProvider } from "./services/MenuProvider.tsx";

import "@mantine/core/styles.css";
import "./index.css";

const router = createMemoryRouter(routes);
const queryClient = new QueryClient();

const env = window.electron.requestEnvironment();

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <UserSettingsProvider>
                <RegimeProvider>
                    <MenuProvider
                        isDev={env.isDev}
                        navigate={(path) => router.navigate(path)}
                    >
                        <RouterProvider router={router} />
                    </MenuProvider>
                </RegimeProvider>
            </UserSettingsProvider>
        </ThemeProvider>
    </QueryClientProvider>,
);
