/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { Navigate, type RouteObject } from "react-router-dom";
import HomePage from "../pages/home-page/HomePage.tsx";
import SettingsPage from "../pages/settings/SettingsPage.tsx";
import ViewerPage from "../pages/viewer/ViewerPage.tsx";
import { BackNavigationLayout } from "../layouts/BackNavigationLayout.tsx";
import UiSettingsPage from "../pages/settings/UiSettingsPage.tsx";
import LanguageSettingsPage from "../pages/settings/LanguageSettingsPage.tsx";
import { MainLayout } from "../layouts/MainLayout.tsx";
import ServerSettingsPage from "../pages/settings/ServerSettingsPage.tsx";
import { ErrorPage } from "../pages/error-page/ErrorPage.tsx";
import ViewerPageLayout from "../layouts/ViewerPageLayout.tsx";
import ExportSettingsPage from "../pages/settings/ExportSettingsPage.tsx";

const routes: RouteObject[] = [
    {
        path: "/",
        element: <Navigate to="/home" />,
    },
    {
        path: "/",
        Component: MainLayout,
        errorElement: <ErrorPage />,
        children: [{ path: "home", Component: HomePage }],
    },
    {
        path: "/",
        Component: ViewerPageLayout,
        errorElement: <ErrorPage />,
        children: [{ path: "viewer", Component: ViewerPage }],
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
                ],
            },
            {
                path: "server",
                Component: ServerSettingsPage,
                children: [{ index: true, Component: ServerSettingsPage }],
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
            {
                path: "export",
                Component: ExportSettingsPage,
                children: [{ index: true, Component: ExportSettingsPage }],
            },
        ],
    },
    {
        path: "*",
        element: <Navigate to="/" />,
    },
];

export default routes;
