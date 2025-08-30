import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import routes from "./router/routes.tsx";
import { UserSettingsProvider } from "./services/UserSettingsProvider.tsx";
import { ThemeProvider } from "./services/ThemeProvider.tsx";

import "@mantine/core/styles.css";
import "./index.css";

const router = createMemoryRouter(routes);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <UserSettingsProvider>
                <RouterProvider router={router} />
            </UserSettingsProvider>
        </ThemeProvider>
    </StrictMode>
);
