import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import routes from "./router/routes.tsx";
import { UserSettingsProvider } from "./services/UserSettingsProvider.tsx";
import { ThemeProvider } from "./services/ThemeProvider.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MolstarProvider } from "./services/MolstarProvider.tsx";

import "@mantine/core/styles.css";
import "./index.css";

const router = createMemoryRouter(routes);
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <UserSettingsProvider>
                <MolstarProvider>
                    <RouterProvider router={router} />
                </MolstarProvider>
            </UserSettingsProvider>
        </ThemeProvider>
    </QueryClientProvider>
);
