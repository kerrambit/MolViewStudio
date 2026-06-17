import { Navigate, type RouteObject } from "react-router-dom";
import HomePage from "../pages/home-page/HomePage.tsx";
import SettingsPage from "../pages/settings/SettingsPage.tsx";
import { Viewer } from "../pages/viewer/Viewer.tsx";
import { BackNavigationLayout } from "../layouts/BackNavigationLayout.tsx";
import UiSettingsPage from "../pages/settings/UiSettingsPage.tsx";
import LanguageSettingsPage from "../pages/settings/LanguageSettingsPage.tsx";
import { MainLayout } from "../layouts/MainLayout.tsx";
import { ServerSettings } from "../pages/settings/ServerSettings.tsx";
import { ErrorPage } from "../pages/error-page/ErrorPage.tsx";

const routes: RouteObject[] = [
    {
        path: "/",
        element: <Navigate to="/home" />,
    },
    {
        path: "/",
        Component: MainLayout,
        errorElement: <ErrorPage />,
        children: [
            { path: "home", Component: HomePage },
            { path: "viewer", Component: Viewer },
        ],
    },

    {
        path: "/settings",
        Component: BackNavigationLayout,
        errorElement: <ErrorPage />,
        children: [
            { index: true, Component: SettingsPage },
            {
                path: "general",
                children: [
                    { path: "language", Component: LanguageSettingsPage },
                    { path: "ui", Component: UiSettingsPage },
                    { path: "notifications", Component: SettingsPage },
                    { path: "help", Component: SettingsPage },
                ],
            },
            {
                path: "account",
                Component: SettingsPage,
                children: [{ index: true, Component: SettingsPage }],
            },
            {
                path: "server",
                Component: ServerSettings,
                children: [{ index: true, Component: ServerSettings }],
            },
            {
                path: "account",
                Component: SettingsPage,
                children: [{ index: true, Component: SettingsPage }],
            },
            {
                path: "formats",
                children: [
                    { path: "input", Component: SettingsPage },
                    { path: "export", Component: SettingsPage },
                ],
            },
            {
                path: "processing",
                children: [
                    { path: "general", Component: SettingsPage },
                    { path: "per-format", Component: SettingsPage },
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
