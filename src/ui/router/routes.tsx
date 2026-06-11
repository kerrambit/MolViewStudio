import { Navigate, type RouteObject } from "react-router-dom";
import Home from "../pages/home/Home.tsx";
import Settings from "../pages/settings/Settings.tsx";
import { Viewer } from "../pages/viewer/Viewer.tsx";
import { BackNavigationLayout } from "../layouts/BackNavigationLayout.tsx";
import { UiSettings } from "../pages/settings/UiSettings.tsx";
import { LanguageSettings } from "../pages/settings/LanguageSettings.tsx";
import { MainLayout } from "../layouts/MainLayout.tsx";
import { ServerSettings } from "../pages/settings/ServerSettings.tsx";
import { ErrorBoundary } from "../components/error-boundary/ErrorBoundary.tsx";

const routes: RouteObject[] = [
    {
        path: "/",
        element: <Navigate to="/home" />,
    },
    {
        path: "/",
        Component: MainLayout,
        errorElement: <ErrorBoundary />,
        children: [
            { path: "home", Component: Home },
            { path: "viewer", Component: Viewer },
        ],
    },

    {
        path: "/settings",
        Component: BackNavigationLayout,
        errorElement: <ErrorBoundary />,
        children: [
            { index: true, Component: Settings },
            {
                path: "general",
                children: [
                    { path: "language", Component: LanguageSettings },
                    { path: "ui", Component: UiSettings },
                    { path: "notifications", Component: Settings },
                    { path: "help", Component: Settings },
                ],
            },
            {
                path: "account",
                Component: Settings,
                children: [{ index: true, Component: Settings }],
            },
            {
                path: "server",
                Component: ServerSettings,
                children: [{ index: true, Component: ServerSettings }],
            },
            {
                path: "account",
                Component: Settings,
                children: [{ index: true, Component: Settings }],
            },
            {
                path: "formats",
                children: [
                    { path: "input", Component: Settings },
                    { path: "export", Component: Settings },
                ],
            },
            {
                path: "processing",
                children: [
                    { path: "general", Component: Settings },
                    { path: "per-format", Component: Settings },
                ],
            },
        ],
    },
    {
        path: "*",
        element: <Navigate to="/" />,
    },
];

export default routes;
